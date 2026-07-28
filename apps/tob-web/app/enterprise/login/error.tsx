'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">页面加载异常</h2>
      <p className="text-sm text-gray-500 mb-4">{error.message || '请刷新重试'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
      >
        重试
      </button>
    </div>
  )
}
