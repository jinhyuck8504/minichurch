export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🏛️ 미니처치
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          싸이월드 미니홈피처럼 쉬운 교회 홈페이지
        </p>
        
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-4">테스트 페이지</h2>
          <p className="text-gray-600 mb-4">
            기본 페이지가 정상적으로 작동합니다.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            테스트 버튼
          </button>
        </div>
      </div>
    </div>
  )
}
