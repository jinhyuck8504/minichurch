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
  
  // 멀티 교회 지원을 위한 새로운 상태들
  const [currentChurch, setCurrentChurch] = useState(null)
  const [userChurches, setUserChurches] = useState([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true)
      await checkUser()
      setLoading(false)
    }
    initializeApp()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setIsLoggedIn(true)
      await loadUserChurches(user.id)
    } else {
      // 로그인하지 않은 경우 기본 교회의 공개 설교만 표시
      await loadPublicSermons()
    }
  }

  const loadUserChurches = async (userId) => {
    try {
      // 사용자가 속한 교회들 가져오기
      const { data: churchData, error } = await supabase
        .from('user_churches')
        .select(`
          id,
          role,
          church_id,
          churches (
            id,
            name,
            slug,
            description,
            logo_url,
            theme_color,
            contact_info,
            address,
            service_times
          )
        `)
        .eq('user_id', userId)

      if (error) throw error

      if (churchData && churchData.length > 0) {
        setUserChurches(churchData)
        // 첫 번째 교회를 현재 교회로 설정
        setCurrentChurch(churchData[0].churches)
        await loadSermons(churchData[0].churches.id)
      } else {
        // 사용자가 아직 어떤 교회에도 속하지 않은 경우
        // 기본 교회를 찾아서 자동으로 연결
        await connectToDefaultChurch(userId)
      }
    } catch (error) {
      console.error('교회 정보 로딩 오류:', error)
      await loadPublicSermons()
    }
  }

  const connectToDefaultChurch = async (userId) => {
    try {
      // 기존 설교가 있는 교회들 찾기
      const { data: existingSermons, error: sermonError } = await supabase
        .from('sermons')
        .select(`
          church_id,
          churches (
            id,
            name,
            slug,
            description,
            logo_url,
            theme_color,
            contact_info,
            address,
            service_times
          )
        `)
        .limit(1)

      if (sermonError) {
        console.error('설교 조회 오류:', sermonError)
        return
      }

      let targetChurch = null

      if (existingSermons && existingSermons.length > 0 && existingSermons[0].churches) {
        // 기존 설교가 있는 교회 사용
        targetChurch = existingSermons[0].churches
      } else {
        // 새 교회 생성
        const { data: newChurch, error: createError } = await supabase
          .from('churches')
          .insert([{
            name: '새소망교회',
            slug: 'newsope-church-' + Date.now(), // 고유 slug
            description: '하나님의 사랑으로 하나 되는 공동체',
            contact_info: { phone: '02-1234-5678', email: 'info@newsope.church' },
            service_times: { 
              sunday_1: '오전 9시', 
              sunday_2: '오전 11시', 
              wednesday: '저녁 7시', 
              friday: '저녁 7시 30분' 
            },
            address: '서울시 강남구 테헤란로 123',
            theme_color: '#4A90E2'
          }])
          .select()
          .single()

        if (createError) {
          console.error('교회 생성 오류:', createError)
          return
        }

        targetChurch = newChurch
      }

      if (!targetChurch) {
        console.error('사용할 교회가 없습니다')
        return
      }

      // 사용자를 교회에 admin으로 연결
      const { error: insertError } = await supabase
        .from('user_churches')
        .insert([{
          user_id: userId,
          church_id: targetChurch.id,
          role: 'admin'
        }])

      if (insertError) {
        console.error('교회 연결 오류:', insertError)
        return
      }

      // 연결 후 다시 사용자 교회 정보 로딩
      await loadUserChurches(userId)
    } catch (error) {
      console.error('기본 교회 연결 오류:', error)
      await loadPublicSermons()
    }
  }

  const loadSermons = async (churchId) => {
    if (!churchId) return
    
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .eq('church_id', churchId)
        .order('sermon_date', { ascending: false })
      
      if (error) throw error
      if (data) setSermons(data)
    } catch (error) {
      console.error('설교 로딩 오류:', error)
      setSermons([])
    }
  }

  const loadPublicSermons = async () => {
    try {
      // 모든 설교를 가져오되, 교회 정보도 함께 가져오기
      const { data, error } = await supabase
        .from('sermons')
        .select(`
          *,
          churches (
            id,
            name,
            slug,
            theme_color,
            description,
            contact_info,
            address,
            service_times
          )
        `)
        .order('sermon_date', { ascending: false })
        .limit(6)
      
      if (error) {
        console.error('공개 설교 로딩 오류:', error)
        setSermons([])
        return
      }
      
      if (data && data.length > 0) {
        setSermons(data)
        // 첫 번째 설교의 교회 정보를 사용
        if (data[0].churches) {
          setCurrentChurch(data[0].churches)
        }
      } else {
        setSermons([])
      }
    } catch (error) {
      console.error('공개 설교 로딩 오류:', error)
      setSermons([])
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        alert('로그인 실패: ' + error.message)
      } else {
        setUser(data.user)
        setIsLoggedIn(true)
        setShowLogin(false)
        await loadUserChurches(data.user.id)
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsLoggedIn(false)
    setCurrentChurch(null)
    setUserChurches([])
    await loadPublicSermons()
  }

  const handleAddSermon = async (e) => {
    e.preventDefault()
    
    if (!currentChurch) {
      alert('교회 정보가 없습니다.')
      return
    }

    const formData = new FormData(e.target)
    
    try {
      const { error } = await supabase
        .from('sermons')
        .insert([{
          church_id: currentChurch.id,
          title: formData.get('title'),
          preacher: formData.get('preacher'),
          sermon_date: formData.get('date'),
          series_name: formData.get('series') || null,
          youtube_url: formData.get('youtube') || null,
          summary: formData.get('summary') || null,
          scripture_reference: formData.get('scripture') || null
        }])
      
      if (error) throw error
      
      alert('설교가 추가되었습니다!')
      setShowAddForm(false)
      await loadSermons(currentChurch.id)
      e.target.reset()
    } catch (error) {
      console.error('설교 추가 오류:', error)
      alert('설교 추가 중 오류가 발생했습니다: ' + error.message)
    }
  }

  const handleUpdateSermon = async (e) => {
    e.preventDefault()
    
    if (!editingSermon || !currentChurch) return

    const formData = new FormData(e.target)
    
    try {
      const { error } = await supabase
        .from('sermons')
        .update({
          title: formData.get('title'),
          preacher: formData.get('preacher'),
          sermon_date: formData.get('date'),
          series_name: formData.get('series') || null,
          youtube_url: formData.get('youtube') || null,
          summary: formData.get('summary') || null,
          scripture_reference: formData.get('scripture') || null
        })
        .eq('id', editingSermon.id)
        .eq('church_id', currentChurch.id) // 보안을 위해 church_id도 확인
      
      if (error) throw error
      
      alert('설교가 수정되었습니다!')
      setEditingSermon(null)
      await loadSermons(currentChurch.id)
    } catch (error) {
      console.error('설교 수정 오류:', error)
      alert('설교 수정 중 오류가 발생했습니다: ' + error.message)
    }
  }

  const deleteSermon = async (sermonId) => {
    if (!currentChurch) return
    
    try {
      const { error } = await supabase
        .from('sermons')
        .delete()
        .eq('id', sermonId)
        .eq('church_id', currentChurch.id) // 보안을 위해 church_id도 확인
      
      if (error) throw error
      
      alert('설교가 삭제되었습니다!')
      await loadSermons(currentChurch.id)
    } catch (error) {
      console.error('설교 삭제 오류:', error)
      alert('설교 삭제 중 오류가 발생했습니다: ' + error.message)
    }
  }

  // 유튜브 ID 추출 함수
  const getYouTubeVideoId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">미니처치 로딩중...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
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
  if (isLoggedIn && user && currentChurch) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold" style={{ color: currentChurch.theme_color || '#4A90E2' }}>
                  🏛️ {currentChurch.name} 관리자
                </h1>
                {userChurches.length > 1 && (
                  <select 
                    className="px-3 py-1 border rounded-md text-sm"
                    value={currentChurch.id}
                    onChange={(e) => {
                      const selectedChurch = userChurches.find(uc => uc.churches.id === e.target.value)
                      if (selectedChurch) {
                        setCurrentChurch(selectedChurch.churches)
                        loadSermons(selectedChurch.churches.id)
                      }
                    }}
                  >
                    {userChurches.map((uc) => (
                      <option key={uc.churches.id} value={uc.churches.id}>
                        {uc.churches.name} ({uc.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.open('/church-settings', '_blank')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>교회 설정</span>
                </button>
                <button
                  onClick={() => window.open('/create-church', '_blank')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>새 교회 만들기</span>
                </button>
                <span className="text-gray-600">{user.email}</span>
                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {userChurches.find(uc => uc.churches.id === currentChurch.id)?.role || 'member'}
                </span>
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
                      성경 구절 (선택)
                    </label>
                    <input
                      name="scripture"
                      type="text"
                      placeholder="예: 요한복음 3:16"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                      성경 구절 (선택)
                    </label>
                    <input
                      name="scripture"
                      type="text"
                      defaultValue={editingSermon.scripture_reference || ''}
                      placeholder="예: 요한복음 3:16"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
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
                          {sermon.scripture_reference && ` · 📖 ${sermon.scripture_reference}`}
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
  const displayChurch = currentChurch || {
    name: '새소망교회',
    theme_color: '#4A90E2',
    description: '하나님의 사랑으로 하나 되는 공동체',
    contact_info: { phone: '02-1234-5678', email: 'info@newsope.church' },
    address: '서울시 강남구 테헤란로 123',
    service_times: {
      sunday_1: '오전 9시',
      sunday_2: '오전 11시', 
      wednesday: '저녁 7시',
      friday: '저녁 7시 30분'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold" style={{ color: displayChurch.theme_color }}>
                🏛️ {displayChurch.name}
              </h1>
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
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            {displayChurch.description || '하나님의 사랑으로 하나 되는 공동체'}
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            {displayChurch.name}에 오신 것을 환영합니다. 함께 하나님의 말씀을 나누고 성장하는 교회입니다.
          </p>
          
          {/* 교회 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">⛪</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">주일예배</h3>
              <p className="text-gray-600">
                {displayChurch.service_times?.sunday_1 && `1부: ${displayChurch.service_times.sunday_1}`}
                {displayChurch.service_times?.sunday_2 && <><br/>2부: {displayChurch.service_times.sunday_2}</>}
                {!displayChurch.service_times?.sunday_1 && !displayChurch.service_times?.sunday_2 && '매주 일요일 오전 11시'}
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">🙏</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">수요예배</h3>
              <p className="text-gray-600">
                {displayChurch.service_times?.wednesday || '매주 수요일 저녁 7시'}
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="font-bold text-xl mb-3 text-gray-800">위치</h3>
              <p className="text-gray-600">
                {displayChurch.address || '서울시 강남구 테헤란로 123'}
              </p>
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
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4 gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        👤 {sermon.preacher}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                        📅 {sermon.sermon_date}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {sermon.series_name && (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          📚 {sermon.series_name}
                        </span>
                      )}
                      {sermon.scripture_reference && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          📖 {sermon.scripture_reference}
                        </span>
                      )}
                    </div>

                    {sermon.summary && (
                      <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                        {sermon.summary.length > 120 ? sermon.summary.substring(0, 120) + '...' : sermon.summary}
                      </p>
                    )}

                    {sermon.youtube_url && getYouTubeVideoId(sermon.youtube_url) ? (
                      <button 
                        onClick={() => window.open(sermon.youtube_url, '_blank')}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        🎥 설교 영상 보기
                      </button>
                    ) : (
                      <div className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-3 rounded-xl font-semibold text-center">
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

      {/* 연락처 및 찾아오시는 길 섹션 */}
      <section className="py-20" style={{ background: `linear-gradient(to right, ${displayChurch.theme_color || '#4A90E2'}, #6366f1)` }}>
        <div className="max-w-6xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-12">📍 찾아오시는 길</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* 연락처 정보 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">📞 연락처</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold">주소</p>
                    <p className="text-blue-100">{displayChurch.address || '서울시 강남구 테헤란로 123'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-semibold">전화번호</p>
                    <p className="text-blue-100">{displayChurch.contact_info?.phone || '02-1234-5678'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <p className="font-semibold">이메일</p>
                    <p className="text-blue-100">{displayChurch.contact_info?.email || 'info@newsope.church'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 예배 시간 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">⏰ 예배 시간</h3>
              <div className="space-y-4 text-left">
                {displayChurch.service_times?.sunday_1 && (
                  <div className="flex justify-between items-center py-3 border-b border-white border-opacity-20">
                    <span className="font-semibold">주일 1부 예배</span>
                    <span className="text-blue-100">{displayChurch.service_times.sunday_1}</span>
                  </div>
                )}
                {displayChurch.service_times?.sunday_2 && (
                  <div className="flex justify-between items-center py-3 border-b border-white border-opacity-20">
                    <span className="font-semibold">주일 2부 예배</span>
                    <span className="text-blue-100">{displayChurch.service_times.sunday_2}</span>
                  </div>
                )}
                {displayChurch.service_times?.wednesday && (
                  <div className="flex justify-between items-center py-3 border-b border-white border-opacity-20">
                    <span className="font-semibold">수요 예배</span>
                    <span className="text-blue-100">{displayChurch.service_times.wednesday}</span>
                  </div>
                )}
                {displayChurch.service_times?.friday && (
                  <div className="flex justify-between items-center py-3">
                    <span className="font-semibold">금요 기도회</span>
                    <span className="text-blue-100">{displayChurch.service_times.friday}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 지하철 안내 */}
          <div className="mt-12 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">🚇 대중교통 이용 안내</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🟢</div>
                <p className="font-semibold mb-2">2호선 강남역</p>
                <p className="text-blue-100 text-sm">12번 출구 도보 5분</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🟡</div>
                <p className="font-semibold mb-2">분당선 선릉역</p>
                <p className="text-blue-100 text-sm">1번 출구 도보 8분</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🚌</div>
                <p className="font-semibold mb-2">버스</p>
                <p className="text-blue-100 text-sm">146, 401, 730번</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">🏛️ {displayChurch.name}</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {displayChurch.description || '하나님의 사랑으로 하나 되는 공동체'}, {displayChurch.name}입니다. 
              언제나 여러분을 환영합니다.
            </p>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-400 text-sm">
              © 2024 {displayChurch.name}. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Made with ❤️ for God's Kingdom
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
