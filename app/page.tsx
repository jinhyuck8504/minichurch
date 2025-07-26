'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '../lib/supabase'

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [sermons, setSermons] = useState([])
  const [showSermonForm, setShowSermonForm] = useState(false)
  
  const supabase = createClient()

  // 사용자 상태 확인
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

  // 설교 목록 불러오기
  const loadSermons = async () => {
    const { data } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
    
    if (data) {
      setSermons(data)
    }
  }

  // 로그인/회원가입 처리
  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) {
          alert('회원가입 실패: ' + error.message)
        } else {
          alert('회원가입 성공! 이메일을 확인 후 로그인해주세요.')
          setIsSignUp(false)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          alert('로그인 실패: ' + error.message)
        } else {
          const { data: { user } } = await supabase.auth.getUser()
          setUser(user)
          setIsLoggedIn(true)
          setShowLogin(false)
          loadSermons()
          alert('로그인 성공!')
        }
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsLoggedIn(false)
    setSermons([])
    alert('로그아웃되었습니다.')
  }

  // 설교 추가
  const handleAddSermon = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
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
      setShowSermonForm(false)
      loadSermons()
      e.target.reset()
    }
  }

  // 로그인 폼 화면
  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
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
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            className="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 관리자 대시보드 화면
  if (isLoggedIn) {
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">설교 관리</h2>
              <button
                onClick={() => setShowSermonForm(!showSermonForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {showSermonForm ? '취소' : '새 설교 추가'}
              </button>
            </div>

            {/* 설교 추가 폼 */}
            {showSermonForm && (
              <form onSubmit={handleAddSermon} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
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
                sermons.map((sermon) => (
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

  // 기본 홈페이지
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🏛️ 미니처치
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            싸이월드 미니홈피처럼 쉬운 교회 홈페이지
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">환영합니다!</h2>
            <p className="text-gray-600 mb-6">
              미니처치가 성공적으로 설치되었습니다. 
              이제 교회 홈페이지를 만들어보세요!
            </p>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              관리자 로그인
