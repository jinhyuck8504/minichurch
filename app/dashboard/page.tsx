'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [sermons, setSermons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadSermons()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const loadSermons = async () => {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
    
    if (data) {
      setSermons(data)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAddSermon = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const { error } = await supabase
      .from('sermons')
      .insert([{
        title: formData.get('title'),
        preacher: formData.get('preacher'),
        sermon_date: formData.get('date'),
        series_name: formData.get('series'),
        youtube_url: formData.get('youtube'),
        summary: formData.get('summary'),
        church_id: '00000000-0000-0000-0000-000000000000'
      }])
    
    if (error) {
      alert('설교 추가 실패: ' + error.message)
    } else {
      alert('설교가 추가되었습니다!')
      setShowForm(false)
      loadSermons()
      ;(e.target as HTMLFormElement).reset()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">🏛️ 미니처치 관리자</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 설교 관리 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">설교 관리</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showForm ? '취소' : '새 설교 추가'}
            </button>
          </div>

          {/* 설교 추가 폼 */}
          {showForm && (
            <form onSubmit={handleAddSermon} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설교 제목
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="하나님의 사랑"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설교자
                  </label>
                  <input
                    name="preacher"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="김목사"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설교 날짜
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시리즈명 (선택)
                  </label>
                  <input
                    name="series"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="여름성경학교"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유튜브 URL (선택)
                </label>
                <input
                  name="youtube"
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설교 요약 (선택)
                </label>
                <textarea
                  name="summary"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="설교 내용을 간단히 요약해주세요"
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                설교 등록
              </button>
            </form>
          )}

          {/* 설교 목록 */}
          <div className="space-y-3">
            {sermons.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                아직 등록된 설교가 없습니다. 첫 번째 설교를 추가해보세요!
              </p>
            ) : (
              sermons.map((sermon: any) => (
                <div key={sermon.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{sermon.title}</h4>
                  <p className="text-sm text-gray-600">
                    {sermon.preacher} · {sermon.sermon_date}
                    {sermon.series_name && ` · ${sermon.series_name}`}
                  </p>
                  {sermon.summary && (
                    <p className="text-sm text-gray-700 mt-2">{sermon.summary}</p>
                  )}
                  {sermon.youtube_url && (
                    
                      href={sermon.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      유튜브에서 보기 →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
