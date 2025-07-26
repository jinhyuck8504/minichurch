'use client'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          🏛️ 미니처치 관리자
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">설교 관리</h2>
          <p className="text-gray-600 mb-4">설교를 추가하고 관리할 수 있습니다.</p>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            설교 추가하기
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">등록된 설교</h3>
          <p className="text-gray-500">아직 등록된 설교가 없습니다.</p>
        </div>
      </div>
    </div>
  )
}
