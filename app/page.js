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
        sermon_date: formData.get('date')
      }])
    
    if (error) {
      alert('오류: ' + error.message)
    } else {
      alert('설교가 추가되었습니다!')
      loadSermons()
      e.target.reset()
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
        <div className="max-w-4xl mx-auto">
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

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-6">📖 설교 관리</h3>
            
            <form onSubmit={handleAddSermon} className="mb-6 space-y-4">
              <input
                name="title"
                type="text"
                placeholder="설교 제목"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                name="preacher"
                type="text"
                placeholder="설교자"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                name="date"
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                설교 등록
              </button>
            </form>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">등록된 설교 목록</h4>
              {sermons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">등록된 설교가 없습니다.</p>
              ) : (
                sermons.map((sermon) => (
                  <div key={sermon.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{sermon.title}</h4>
                        <p className="text-sm text-gray-600">
                          {sermon.preacher} · {sermon.sermon_date}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => alert('수정 기능은 다음 업데이트에서 제공될 예정입니다!')}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                        >
                          수정
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              deleteSermon(sermon.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
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
        <h1 className="text-4xl font-bold text-blue-600 mb-4">🏛️ 미니처치</h1>
        <p className="text-xl text-gray-600 mb-8">
          싸이월드 미니홈피처럼 쉬운 교회 홈페이지
        </p>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-4">환영합니다!</h2>
          <p className="text-gray-600 mb-6">
            미니처치가 성공적으로 설치되었습니다.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            관리자 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
