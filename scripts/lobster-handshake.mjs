import net from 'node:net'

function parseUrl(input, fallbackProtocol) {
  try {
    return new URL(input)
  } catch {
    return new URL(`${fallbackProtocol}://${input}`)
  }
}

function tcpProbe(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port })
    const finish = (result) => {
      socket.removeAllListeners()
      try {
        socket.destroy()
      } catch {
        // ignore
      }
      resolve(result)
    }

    socket.once('connect', () => finish({ ok: true }))
    socket.once('error', (err) => finish({ ok: false, error: err }))
    socket.setTimeout(timeoutMs, () => finish({ ok: false, timeout: true }))
  })
}

async function httpProbe(baseHttpUrl, path, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(new URL(path, baseHttpUrl), {
      method: 'GET',
      signal: controller.signal,
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, body: text.slice(0, 200) }
  } catch (err) {
    return { ok: false, error: err }
  } finally {
    clearTimeout(timeout)
  }
}

async function wsProbe(wsUrl, timeoutMs, helloPayload) {
  return new Promise((resolve) => {
    let settled = false
    let gotMessage = false

    const finish = (result) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const ws = new WebSocket(wsUrl)

    const timeout = setTimeout(() => {
      finish({ ok: gotMessage, timeout: true })
      try {
        ws.close()
      } catch {
        // ignore
      }
    }, timeoutMs)

    ws.addEventListener('open', () => {
      if (helloPayload !== undefined) {
        try {
          ws.send(helloPayload)
        } catch {
          // ignore
        }
      }
    })

    ws.addEventListener('message', (event) => {
      gotMessage = true
      const data =
        typeof event.data === 'string'
          ? event.data
          : Buffer.from(event.data).toString('utf8')
      clearTimeout(timeout)
      finish({ ok: true, message: data.slice(0, 500) })
      try {
        ws.close()
      } catch {
        // ignore
      }
    })

    ws.addEventListener('error', (event) => {
      clearTimeout(timeout)
      finish({ ok: false, error: event?.message ?? String(event) })
      try {
        ws.close()
      } catch {
        // ignore
      }
    })

    ws.addEventListener('close', (event) => {
      clearTimeout(timeout)
      if (!settled) {
        finish({ ok: gotMessage, closed: true, code: event.code, reason: event.reason })
      }
    })
  })
}

async function main() {
  const raw = process.argv[2] ?? 'ws://127.0.0.1:18789'
  const wsUrl = parseUrl(raw, 'ws')
  const host = wsUrl.hostname || '127.0.0.1'
  const port = Number(wsUrl.port || 80)
  const timeoutMs = Number(process.env.HANDSHAKE_TIMEOUT_MS || 1500)

  console.log(`[lobster-handshake] target: ${wsUrl.toString()}`)
  console.log(`[lobster-handshake] tcp probe: ${host}:${port}`)

  const tcp = await tcpProbe(host, port, Math.min(timeoutMs, 1200))
  if (!tcp.ok) {
    const errCode = tcp.timeout ? 'TIMEOUT' : tcp.error?.code || tcp.error?.message || 'UNKNOWN'
    console.log(`[lobster-handshake] tcp: FAIL (${errCode})`)
    console.log('[lobster-handshake] hint: 请先启动龙虾哥/OpenClaw 服务，并确认监听端口 18789')
    return
  }
  console.log('[lobster-handshake] tcp: OK')

  const httpBase = new URL(`http://${host}:${port}`)
  const health = await httpProbe(httpBase, '/health', timeoutMs)
  if (health.ok) {
    console.log(`[lobster-handshake] http /health: ${health.status} ${health.body}`)
  } else {
    console.log('[lobster-handshake] http /health: FAIL')
  }

  const hello = JSON.stringify({ type: 'handshake', from: 'tree', ts: Date.now() })
  const ws = await wsProbe(wsUrl.toString(), timeoutMs, hello)
  if (ws.ok) {
    console.log('[lobster-handshake] ws: OK')
    if (ws.message) console.log(`[lobster-handshake] ws message: ${ws.message}`)
    return
  }

  console.log('[lobster-handshake] ws: FAIL')
  if (ws.error) console.log(`[lobster-handshake] ws error: ${ws.error}`)
  if (ws.closed) console.log(`[lobster-handshake] ws closed: ${ws.code} ${ws.reason || '(no reason)'}`)

  const socketIoUrl = `ws://${host}:${port}/socket.io/?EIO=4&transport=websocket`
  console.log(`[lobster-handshake] try socket.io: ${socketIoUrl}`)
  const socketIo = await wsProbe(socketIoUrl, timeoutMs, undefined)
  if (socketIo.ok) {
    console.log('[lobster-handshake] socket.io websocket: OK')
    if (socketIo.message) console.log(`[lobster-handshake] socket.io message: ${socketIo.message}`)
    return
  }
  console.log('[lobster-handshake] socket.io websocket: FAIL')
  if (socketIo.error) console.log(`[lobster-handshake] socket.io error: ${socketIo.error}`)
}

await main()
