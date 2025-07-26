'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">
            🏛️ 미니처치 로그인
          </h1>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="이메일"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              로그인
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

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
            <div className="space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                관리자 로그인
              </button>
              <Link
                href="/login"
                className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                별도 로그인 페이지
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
