'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <h2 className="text-xl font-semibold text-red-600 mb-2">出错了</h2>
      <p className="text-gray-500 mb-4">{error.message || '页面加载异常'}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        重试
      </button>
    </div>
  )
}
