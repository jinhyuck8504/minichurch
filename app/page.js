'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sermons, setSermons] = useState([])
  const [editingSermon, setEditingSermon] = useState(null)
  const [viewMode, setViewMode] = useState('manage') // 'manage' or 'preview'
  const [selectedSermon, setSelectedSermon] = useState(null) // 상세보기용
  
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setIsLoggedIn(true)
        loadSermons()
      }
    }
    checkUser()
  }, [])

  const loadSermons = async () => {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
    
    if (data) {
      setSermons(data)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      alert('로그인 실패: ' + error.message)
    } else {
      setUser(data.user)
      setIsLoggedIn(true)
      setShowLogin(false)
      loadSermons()
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsLoggedIn(false)
  }

  const handleAddSermon = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const { error } = await supabase
      .from('sermons')
      .insert([{
        title: formData.get('title'),
        preacher: formData.get('preacher'),
        sermon_date: formData.get('date'),
        series_name: formData.get('series') || null,
        youtube_url: formData.get('youtube') || null,
        summary: formData.get('summary') || null
      }])
    
    if (error) {
      alert('오류: ' + error.message)
    } else {
      alert('설교가 추가되었습니다!')
      loadSermons()
      e.target.reset()
    }
  }

  const handleUpdateSermon = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const { error } = await supabase
      .from('sermons')
      .update({
        title: formData.get('title'),
        preacher: formData.get('preacher'),
        sermon_date: formData.get('date'),
        series_name: formData.get('series') || null,
        youtube_url: formData.get('youtube') || null,
        summary: formData.get('summary') || null
      })
      .eq('id', editingSermon.id)
    
    if (error) {
      alert('수정 실패: ' + error.message)
    } else {
      alert('설교가 수정되었습니다!')
      setEditingSermon(null)
      loadSermons()
    }
  }

  const deleteSermon = async (sermonId) => {
    const { error } = await supabase
      .from('sermons')
      .delete()
      .eq('id', sermonId)
    
    if (error) {
      alert('삭제 실패: ' + error.message)
    } else {
      alert('설교가 삭제되었습니다!')
      loadSermons()
    }
  }

  // 유튜브 ID 추출 함수
  const getYouTubeVideoId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md"
            >
              {loading ? '처리중...' : '로그인'}
            </button>
          </form>
          <button
            onClick={() => setShowLogin(false)}
            className="w-full mt-4 bg-gray-300 text-gray-700 py-2 rounded-md"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">🏛️ 미니처치 관리자</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b">
              <button
                onClick={() => {
                  setViewMode('manage')
                  setSelectedSermon(null)
                }}
                className={`px-6 py-3 font-medium ${
                  viewMode === 'manage' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 설교 관리
              </button>
              <button
                onClick={() => {
                  setViewMode('preview')
                  setSelectedSermon(null)
                }}
                className={`px-6 py-3 font-medium ${
                  viewMode === 'preview' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👁️ 미리보기 (성도용)
              </button>
            </div>
          </div>

          {/* 관리 모드 */}
          {viewMode === 'manage' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-6">📝 설교 관리</h3>
              
              {/* 설교 추가/수정 폼 */}
              {!editingSermon ? (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-4">새 설교 추가</h4>
                  <form onSubmit={handleAddSermon} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="title"
                        type="text"
                        placeholder="설교 제목"
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        name="preacher"
                        type="text"
                        placeholder="설교자"
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        name="date"
                        type="date"
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        name="series"
                        type="text"
                        placeholder="시리즈명 (선택)"
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <input
                      name="youtube"
                      type="url"
                      placeholder="유튜브 URL (선택)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <textarea
                      name="summary"
                      placeholder="설교 요약 (선택)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      설교 등록
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold mb-4">설교 수정</h4>
                  <form onSubmit={handleUpdateSermon} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="title"
                        type="text"
                        defaultValue={editingSermon.title}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        name="preacher"
                        type="text"
                        defaultValue={editingSermon.preacher}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        name="date"
                        type="date"
                        defaultValue={editingSermon.sermon_date}
                        required
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        name="series"
                        type="text"
                        defaultValue={editingSermon.series_name || ''}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <input
                      name="youtube"
                      type="url"
                      defaultValue={editingSermon.youtube_url || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <textarea
                      name="summary"
                      defaultValue={editingSermon.summary || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-orange-600 text-white px-4 py-2 rounded"
                      >
                        수정 완료
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSermon(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 설교 목록 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">등록된 설교 ({sermons.length}개)</h4>
                {sermons.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">등록된 설교가 없습니다.</p>
                ) : (
                  sermons.map((sermon) => (
                    <div key={sermon.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <button
                            onClick={() => setSelectedSermon(selectedSermon?.id === sermon.id ? null : sermon)}
                            className="text-left w-full"
                          >
                            <h4 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {sermon.title} {selectedSermon?.id === sermon.id ? '▼' : '▶'}
                            </h4>
                          </button>
                          <p className="text-sm text-gray-600 mb-2">
                            {sermon.preacher} · {sermon.sermon_date}
                            {sermon.series_name && ` · ${sermon.series_name}`}
                          </p>
                          
                          {/* 설교 상세 내용 (펼치기) */}
                          {selectedSermon?.id === sermon.id && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              {sermon.youtube_url && (
                                <div className="mb-4">
                                  <h5 className="font-medium mb-2">🎥 설교 영상</h5>
                                  {getYouTubeVideoId(sermon.youtube_url) ? (
                                    <div className="aspect-video">
                                      <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(sermon.youtube_url)}`}
                                        title={sermon.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded-lg"
                                      ></iframe>
                                    </div>
                                  ) : (
                                    <a 
                                      href={sermon.youtube_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      유튜브에서 보기 →
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {sermon.summary && (
                                <div>
                                  <h5 className="font-medium mb-2">📝 설교 요약</h5>
                                  <p className="text-gray-700 whitespace-pre-wrap">{sermon.summary}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button 
                            onClick={() => setEditingSermon(sermon)}
                            className="text-blue-600 text-sm px-2 py-1 border rounded"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('정말 삭제하시겠습니까?')) {
                                deleteSermon(sermon.id)
                              }
                            }}
                            className="text-red-600 text-sm px-2 py-1 border rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 미리보기 모드 (성도용) */}
          {viewMode === 'preview' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-blue-600 mb-2">🏛️ 새소망교회</h2>
                <p className="text-gray-600">하나님의 사랑으로 하나 되는 공동체</p>
              </div>

              <h3 className="text-2xl font-semibold mb-6 text-center">📖 설교 말씀</h3>
              
              {sermons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">등록된 설교가 없습니다.</p>
              ) : (
                <div className="grid gap-6">
                  {sermons.map((sermon) => (
                    <div key={sermon.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="mb-4">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">{sermon.title}</h4>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <span>👤 {sermon.preacher}</span>
                          <span className="mx-2">•</span>
                          <span>📅 {sermon.sermon_date}</span>
                          {sermon.series_name && (
                            <>
                              <span className="mx-2">•</span>
                              <span>📚 {sermon.series_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {sermon.youtube_url && getYouTubeVideoId(sermon.youtube_url) && (
                        <div className="mb-4">
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${getYouTubeVideoId(sermon.youtube_url)}`}
                              title={sermon.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      )}

                      {sermon.summary && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-medium text-blue-800 mb-2">📝 설교 요약</h5>
                          <p className="text-gray-700 whitespace-pre-wrap">{sermon.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">🏛️ 미니처치</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-4">환영합니다!</h2>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            관리자 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
