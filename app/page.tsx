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
  const [isSignUp, setIsSignUp] = useState(false)
  
  const supabase = createClient()

  // 페이지 로드시 로그인 상태 확인
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setIsLoggedIn(true)
      }
    }
    checkUser()
  }, [])

  // 로그인/회원가입 처리
  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // 회원가입
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          alert('회원가입 실패: ' + error.message)
        } else {
          alert('회원가입 성공! 바로 로그인할 수 있습니다.')
          setIsSignUp(false)
        }
      } else {
        // 로그인
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
          alert('로그인 성공!')
        }
      }
    } catch (error) {
      alert('오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsLoggedIn(false)
    alert('로그아웃되었습니다.')
  }

  // 로그인 폼 화면
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">
            🏛️ 미니처치 {isSignUp ? '회원가입' : '로그인'}
          </h1>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="비밀번호 (최소 6자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '처리중...' : (isSignUp ? '회원가입' : '로그인')}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
          
          <button
            onClick={() => setShowLogin(false)}
            className="w-full mt-4 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 로그인 완료 후 관리자 화면
  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">🏛️ 미니처치 관리자</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">환영합니다, {user.email}님!</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 관리 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📖 설교 관리</h3>
              <p className="text-gray-600 mb-4">설교 영상과 자료를 추가하고 관리하세요.</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                설교 관리하기
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📢 교회 소식</h3>
              <p className="text-gray-600 mb-4">교회 행사와 공지사항을 작성하세요.</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                소식 작성하기
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🖼️ 교회 앨범</h3>
              <p className="text-gray-600 mb-4">교회 행사 사진들을 업로드하세요.</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                앨범 관리하기
              </button>
            </div>
          </div>

          {/* 빠른 통계 */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">📊 현황</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-gray-600">등록된 설교</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-gray-600">작성된 소식</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-gray-600">업로드된 사진</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 기본 홈 화면
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
          <h2 className="text-2xl font-semibold mb-4">환영합니다!</h2>
          <p className="text-gray-600 mb-6">
            미니처치가 성공적으로 설치되었습니다. 
            이제 교회 홈페이지를 만들어보세요!
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
