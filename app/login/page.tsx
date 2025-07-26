'use client'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">🏛️ 미니처치</h1>
          <h2 className="text-xl font-semibold text-gray-900 mt-2">로그인</h2>
        </div>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="••••••••"
            />
          </div>

          <button
            type="button"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            onClick={() => alert('기능 준비중입니다!')}
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  )
}
