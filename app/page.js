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
    const { data } = await supabase.from('sermons').select('*').order('sermon_date', { ascending: false })
    if (data) setSermons(data)
  }

  const loadPublicSermons = async () => {
    const { data } = await supabase.from('sermons').select('*').order('sermon_date', { ascending: false }).limit(6)
    if (data) setSermons(data)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert('로그인 실패')
    } else {
      setUser(data.user)
      setIsLoggedIn(true)
      setShowLogin(false)
      loadSermons()
    }
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">미니처치 관리자</h1>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  setUser(null)
                  setIsLoggedIn(false)
                }}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                로그아웃
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">설교 목록</h3>
            {sermons.length === 0 ? (
              <p className="text-gray-500 text-center py-8">등록된 설교가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {sermons.map((sermon) => (
                  <div key={sermon.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold">{sermon.title}</h4>
                    <p className="text-sm text-gray-600">{sermon.preacher} · {sermon.sermon_date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 공개 홈페이지
  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white shadow p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-600">새소망교회</h1>
          <button
            onClick={() => setShowLogin(true)}
            className="text-sm text-gray-600 px-3 py-1 border rounded"
          >
            관리자
          </button>
        </div>
      </header>

      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">하나님의 사랑으로 하나 되는 공동체</h2>
          <p className="text-xl text-gray-600">새소망교회에 오신 것을 환영합니다</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">최근 설교</h2>
          
          {sermons.length === 0 ? (
            <p className="text-center text-gray-500">등록된 설교가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sermons.map((sermon) => (
                <div key={sermon.id} className="bg-white border rounded-lg p-6 shadow">
                  <h3 className="text-lg font-bold mb-2">{sermon.title}</h3>
                  <p className="text-gray-600">{sermon.preacher} · {sermon.sermon_date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8 text-center">
        <p>새소망교회 - 미니처치로 제작</p>
      </footer>
    </div>
  )
}
