'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sermons, setSermons] = useState([])
  const [editingSermon, setEditingSermon] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedSermon, setSelectedSermon] = useState(null)
  
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
    loadPublicSermons()
  }, [])

  const loadSermons = async () => {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
    if (data) setSermons(data)
  }

  const loadPublicSermons = async () => {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(6)
    if (data) setSermons(data)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert('로그인 실패: ' + error.message)
    } else {
      setUser(data.user)
      setIsLoggedIn(true)
      setShowLogin(false)
      loadSermons()
    }
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
      setShowAddForm(false)
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

  // 로그인 폼
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">관리자 로그인</h1>
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
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md">
              로그인
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

  // 관리자 화면
  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">🏛️ 미니처치 관리자</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">📖 설교 관리</h3>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  setEditingSermon(null)
                  setSelectedSermon(null)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {showAddForm ? '취소' : '+ 새 설교 추가'}
              </button>
            </div>

            {/* 설교 추가 폼 */}
            {showAddForm && (
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-4 text-blue-800">새 설교 추가</h4>
                <form onSubmit={handleAddSermon} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설교 제목 *
                      </label>
                      <input
                        name="title"
                        type="text"
                        placeholder="예: 하나님의 사랑"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설교자 *
                      </label>
                      <input
                        name="preacher"
                        type="text"
                        placeholder="예: 김목사"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설교 날짜 *
                      </label>
                      <input
                        name="date"
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        시리즈명 (선택)
                      </label>
                      <input
                        name="series"
                        type="text"
                        placeholder="예: 여름성경학교"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설교 요약 (선택)
                    </label>
                    <textarea
                      name="summary"
                      placeholder="설교 내용을 간단히 요약해주세요"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
                    >
                      설교 등록
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 설교 수정 폼 */}
            {editingSermon && (
              <div className="mb-6 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold mb-4 text-yellow-800">설교 수정</h4>
                <form onSubmit={handleUpdateSermon} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설교 제목 *
                      </label>
                      <input
                        name="title"
                        type="text"
                        defaultValue={editingSermon.title}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설교자 *
                      </label>
                      <input
                        name="preacher"
                        type="text"
                        defaultValue={editingSermon.preacher}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        설교 날짜 *
                      </label>
                      <input
                        name="date"
                        type="date"
                        defaultValue={editingSermon.sermon_date}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        시리즈명 (선택)
                      </label>
                      <input
                        name="series"
                        type="text"
                        defaultValue={editingSermon.series_name || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                      defaultValue={editingSermon.youtube_url || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설교 요약 (선택)
                    </label>
                    <textarea
                      name="summary"
                      defaultValue={editingSermon.summary || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-medium"
                    >
                      수정 완료
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSermon(null)}
                      className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
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
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">아직 등록된 설교가 없습니다.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    첫 번째 설교 추가하기
                  </button>
                </div>
              ) : (
                sermons.map((sermon) => (
                  <div key={sermon.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <button
                          onClick={() => setSelectedSermon(selectedSermon?.id === sermon.id ? null : sermon)}
                          className="text-left w-full"
                        >
                          <h4 className="font-semibold text-gray-900 text-lg mb-1 hover:text-blue-600 cursor-pointer">
                            {sermon.title} {selectedSermon?.id === sermon.id ? '▼' : '▶'}
                          </h4>
                        </button>
                        <p className="text-sm text-gray-600 mb-2">
                          👤 {sermon.preacher} · 📅 {sermon.sermon_date}
                          {sermon.series_name && ` · 📚 ${sermon.series_name}`}
                        </p>
                        
                        {/* 설교 상세 내용 (펼치기/접기) */}
                        {selectedSermon?.id === sermon.id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            {sermon.youtube_url && getYouTubeVideoId(sermon.youtube_url) && (
                              <div className="mb-4">
                                <h5 className="font-medium mb-2">🎥 설교 영상</h5>
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
                              <div>
                                <h5 className="font-medium mb-2">📝 설교 요약</h5>
                                <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                                  {sermon.summary}
                                </p>
                              </div>
                            )}
                            
                            {!sermon.youtube_url && !sermon.summary && (
                              <p className="text-gray-500 text-center py-4">
                                추가 정보가 없습니다. 유튜브 URL이나 요약을 추가해보세요.
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* 간단 표시 (접혀있을 때) */}
                        {selectedSermon?.id !== sermon.id && (
                          <>
                            {sermon.youtube_url && (
                              <p className="text-sm text-red-600 mb-2">🎥 유튜브 영상 있음</p>
                            )}
                            {sermon.summary && (
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                                📝 {sermon.summary.length > 100 ? sermon.summary.substring(0, 100) + '...' : sermon.summary}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          onClick={() => {
                            setEditingSermon(sermon)
                            setShowAddForm(false)
                            setSelectedSermon(null)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              deleteSermon(sermon.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
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
        </div>
      </div>
    )
  }

  // 공개 홈페이지 (아름다운 버전)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-blue-600">🏛️ 새소망교회</h1>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              관리자
            </button>
          </div>
        </div>
      </header>

      {/* 교회 소개 섹션 */}
      <section className="py-20 text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">하나님의 사랑으로 하나 되는 공동체</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            새소망교회에 오신 것을 환영합니다. 함께 하나님의 말씀을 나누고 성장하는 교회입니다.
          </p>
          
          {/* 교회 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">⛪</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">주일예배</h3>
              <p className="text-gray-600">매주 일요일 오전 11시</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">🙏</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">수요예배</h3>
              <p className="text-gray-600">매주 수요일 저녁 7시</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">위치</h3>
              <p className="text-gray-600">서울시 강남구 테헤란로 123</p>
            </div>
          </div>
        </div>
      </section>

      {/* 설교 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">📖 최근 설교 말씀</h2>
            <p className="text-xl text-gray-600">하나님의 말씀으로 은혜받으세요</p>
          </div>

          {sermons.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📖</div>
              <p className="text-xl text-gray-500 mb-4">아직 등록된 설교가 없습니다.</p>
              <p className="text-gray-400">곧 새로운 말씀으로 찾아뵙겠습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sermons.map((sermon) => (
                <div key={sermon.id} className="group bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  {/* 유튜브 썸네일 또는 기본 이미지 */}
                  {sermon.youtube_url && getYouTubeVideoId(sermon.youtube_url) ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(sermon.youtube_url)}/maxresdefault.jpg`}
                        alt={sermon.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <div className="bg-red-600 text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        설교 영상
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-5xl mb-3">📖</div>
                        <p className="text-xl font-semibold">설교 말씀</p>
                      </div>
                    </div>
                  )}

                  {/* 카드 내용 */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {sermon.title}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-4 space-x-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        👤 {sermon.preacher}
                      </span>
                      <span className="flex items-center">
                        📅 {sermon.sermon_date}
                      </span>
                    </div>

                    {sermon.series_name && (
                      <div className="mb-4">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          📚 {sermon.series_name}
                        </span>
                      </div>
                    )}

                    {sermon.summary && (
                      <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                        {sermon.summary.length > 120 ? sermon.summary.substring(0, 120) + '...' : sermon.summary}
                      </p>
                    )}

                    {sermon.youtube_url && getYouTubeVideoId(sermon.youtube_url) ? (
                      <button 
                        onClick={() => window.open(sermon.youtube_url, '_blank')}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                        <span>설교 시청하기</span>
                      </button>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-semibold text-center">
                        📖 설교 말씀
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 교회 소식 및 연락처 */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">📞 교회 연락처</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="text-3xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-2">주소</h3>
              <p className="opacity-90">서울시 강남구 테헤란로 123</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="text-3xl mb-4">📞</div>
              <h3 className="text-xl font-semibold mb-2">전화번호</h3>
              <p className="opacity-90">02-1234-5678</p>
            </div>
            <div className="bg-white bg-opacity-10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="text-3xl mb-4">✉️</div>
              <h3 className="text-xl font-semibold mb-2">이메일</h3>
              <p className="opacity-90">info@newhopeChurch.org</p>
            </div>
          </div>
          
          <div className="mt-12 p-8 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
            <h3 className="text-2xl font-bold mb-4">🎉 교회 소식</h3>
            <p className="text-lg opacity-90 mb-4">
              새소망교회에서 함께 예배하고 교제할 성도님들을 환영합니다!
            </p>
            <p className="opacity-80">
              처음 오시는 분들을 위한 새가족 환영식이 매월 첫째 주일에 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <h2 className="text-2xl font-bold">🏛️ 새소망교회</h2>
          </div>
          <p className="text-gray-400 mb-4">
            하나님의 사랑으로 하나 되는 공동체
          </p>
          <div className="text-sm text-gray-500">
            <p>© 2025 새소망교회. All rights reserved.</p>
            <p className="mt-2">주소: 서울시 강남구 테헤란로 123 | 전화: 02-1234-5678</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
