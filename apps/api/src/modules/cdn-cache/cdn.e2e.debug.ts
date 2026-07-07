import 'reflect-metadata'
import { Controller, Get, Injectable } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

class SimpleService {
  ping() { return 'pong' }
}

@Controller('test')
class PingController {
  constructor(private svc: SimpleService) {}
  @Get()
  ping() { return { ok: true, svcType: typeof this.svc, svcExists: this.svc != null } }
}

async function main() {
  const modRef = await Test.createTestingModule({
    controllers: [PingController],
    providers: [{ provide: SimpleService, useValue: new SimpleService() }],
  }).compile()
  const app = modRef.createNestApplication()
  await app.init()
  const res = await request(app.getHttpServer()).get('/test')
  console.log('Status:', res.statusCode)
  console.log('Body:', JSON.stringify(res.body))
  await app.close()
}
main().catch(console.error)
