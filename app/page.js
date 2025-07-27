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
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">미니처치 관리자</h1>
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-6">설교 관리</h3>
            
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
                        <h4 className="font-semibold text-gray-900">{sermon.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {sermon.preacher} · {sermon.sermon_date}
                          {sermon.series_name && ` · ${sermon.series_name}`}
                        </p>
                        {sermon.summary && (
                          <p className="text-sm text-gray-700 mb-2 p-2 bg-gray-50 rounded">
                            {sermon.summary}
                          </p>
                        )}
                        {sermon.youtube_url && (
                          <p className="text-red-600 text-sm">유튜브 링크 있음</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">미니처치</h1>
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
