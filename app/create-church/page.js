'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function CreateChurchPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    theme_color: '#4A90E2',
    // 예배 시간
    sunday_1: '',
    sunday_2: '',
    wednesday: '',
    friday: ''
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // 교회명이 변경되면 slug도 자동 생성
    if (name === 'name') {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({
        ...prev,
        slug: autoSlug
      }))
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('교회명을 입력해주세요.')
      return false
    }
    if (!formData.slug.trim()) {
      alert('교회 URL을 입력해주세요.')
      return false
    }
    if (!formData.description.trim()) {
      alert('교회 소개를 입력해주세요.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)

    try {
      // 1. 교회 생성
      const { data: church, error: churchError } = await supabase
        .from('churches')
        .insert([{
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          address: formData.address.trim() || null,
          theme_color: formData.theme_color,
          contact_info: {
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            website: formData.website.trim() || null
          },
          service_times: {
            sunday_1: formData.sunday_1.trim() || null,
            sunday_2: formData.sunday_2.trim() || null,
            wednesday: formData.wednesday.trim() || null,
            friday: formData.friday.trim() || null
          }
        }])
        .select()
        .single()

      if (churchError) {
        if (churchError.code === '23505') {
          alert('이미 사용 중인 교회 URL입니다. 다른 URL을 입력해주세요.')
        } else {
          alert('교회 생성 중 오류가 발생했습니다: ' + churchError.message)
        }
        return
      }

      // 2. 사용자를 교회 관리자로 등록
      const { error: userChurchError } = await supabase
        .from('user_churches')
        .insert([{
          user_id: user.id,
          church_id: church.id,
          role: 'admin'
        }])

      if (userChurchError) {
        console.error('사용자-교회 연결 오류:', userChurchError)
        // 교회는 생성되었으니 계속 진행
      }

      alert('🎉 교회가 성공적으로 생성되었습니다!')
      router.push('/')

    } catch (error) {
      console.error('교회 생성 오류:', error)
      alert('교회 생성 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">로딩중...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🏛️ 새 교회 등록</h1>
          <p className="text-xl text-gray-600">미니처치에서 우리 교회만의 홈페이지를 만들어보세요!</p>
        </div>

        {/* 등록 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 섹션 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                📝 기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    교회명 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="예: 새소망교회"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    교회 URL * 
                    <span className="text-gray-500 text-xs ml-2">
                      (사이트 주소에 사용됩니다)
                    </span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      minichurch.com/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="newsope-church"
                      required
                      pattern="[a-z0-9-]+"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    영문 소문자, 숫자, 하이픈(-)만 사용 가능
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    교회 소개 *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="예: 하나님의 사랑으로 하나 되는 공동체"
                    rows={3}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="예: 서울시 강남구 테헤란로 123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 연락처 정보 섹션 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                📞 연락처 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="02-1234-5678"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="info@church.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    웹사이트
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.church.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 예배 시간 섹션 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                ⏰ 예배 시간
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주일 1부 예배
                  </label>
                  <input
                    type="text"
                    name="sunday_1"
                    value={formData.sunday_1}
                    onChange={handleInputChange}
                    placeholder="예: 오전 9시"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주일 2부 예배
                  </label>
                  <input
                    type="text"
                    name="sunday_2"
                    value={formData.sunday_2}
                    onChange={handleInputChange}
                    placeholder="예: 오전 11시"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수요 예배
                  </label>
                  <input
                    type="text"
                    name="wednesday"
                    value={formData.wednesday}
                    onChange={handleInputChange}
                    placeholder="예: 저녁 7시"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    금요 기도회
                  </label>
                  <input
                    type="text"
                    name="friday"
                    value={formData.friday}
                    onChange={handleInputChange}
                    placeholder="예: 저녁 7시 30분"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 디자인 설정 섹션 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                🎨 디자인 설정
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    테마 색상
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      name="theme_color"
                      value={formData.theme_color}
                      onChange={handleInputChange}
                      className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.theme_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#4A90E2"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    교회 홈페이지의 메인 색상입니다
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상 미리보기
                  </label>
                  <div 
                    className="w-full h-12 rounded-lg border border-gray-300 flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: formData.theme_color }}
                  >
                    🏛️ {formData.name || '교회명'}
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-between pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>교회 생성 중...</span>
                  </>
                ) : (
                  <>
                    <span>🏛️</span>
                    <span>교회 생성하기</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
