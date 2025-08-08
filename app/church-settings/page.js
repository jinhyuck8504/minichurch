'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function ChurchSettingsPage() {
  const [user, setUser] = useState(null)
  const [userChurches, setUserChurches] = useState([])
  const [currentChurch, setCurrentChurch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic') // basic, contact, service, design, members
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    theme_color: '#4A90E2',
    contact_info: {
      phone: '',
      email: '',
      website: ''
    },
    service_times: {
      sunday_1: '',
      sunday_2: '',
      wednesday: '',
      friday: ''
    }
  })

  const [members, setMembers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    setUser(user)
    await loadUserChurches(user.id)
    setLoading(false)
  }

  const loadUserChurches = async (userId) => {
    try {
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
        const firstChurch = churchData[0].churches
        setCurrentChurch(firstChurch)
        setFormData({
          name: firstChurch.name || '',
          slug: firstChurch.slug || '',
          description: firstChurch.description || '',
          address: firstChurch.address || '',
          theme_color: firstChurch.theme_color || '#4A90E2',
          contact_info: {
            phone: firstChurch.contact_info?.phone || '',
            email: firstChurch.contact_info?.email || '',
            website: firstChurch.contact_info?.website || ''
          },
          service_times: {
            sunday_1: firstChurch.service_times?.sunday_1 || '',
            sunday_2: firstChurch.service_times?.sunday_2 || '',
            wednesday: firstChurch.service_times?.wednesday || '',
            friday: firstChurch.service_times?.friday || ''
          }
        })
        
        await loadChurchMembers(firstChurch.id)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('교회 정보 로딩 오류:', error)
      router.push('/')
    }
  }

  const loadChurchMembers = async (churchId) => {
    try {
      const { data, error } = await supabase
        .from('user_churches')
        .select(`
          id,
          role,
          created_at,
          user_id
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('멤버 로딩 오류:', error)
      setMembers([])
    }
  }

  const handleChurchSwitch = async (churchId) => {
    const selectedChurch = userChurches.find(uc => uc.churches.id === churchId)
    if (selectedChurch) {
      const church = selectedChurch.churches
      setCurrentChurch(church)
      setFormData({
        name: church.name || '',
        slug: church.slug || '',
        description: church.description || '',
        address: church.address || '',
        theme_color: church.theme_color || '#4A90E2',
        contact_info: {
          phone: church.contact_info?.phone || '',
          email: church.contact_info?.email || '',
          website: church.contact_info?.website || ''
        },
        service_times: {
          sunday_1: church.service_times?.sunday_1 || '',
          sunday_2: church.service_times?.sunday_2 || '',
          wednesday: church.service_times?.wednesday || '',
          friday: church.service_times?.friday || ''
        }
      })
      await loadChurchMembers(church.id)
    }
  }

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const getCurrentUserRole = () => {
    if (!currentChurch || !userChurches) return 'viewer'
    const userChurch = userChurches.find(uc => uc.churches.id === currentChurch.id)
    return userChurch?.role || 'viewer'
  }

  const canEdit = () => {
    const role = getCurrentUserRole()
    return role === 'admin'
  }

  const handleSave = async () => {
    if (!canEdit()) {
      alert('교회 설정을 변경할 권한이 없습니다.')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('churches')
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          theme_color: formData.theme_color,
          contact_info: formData.contact_info,
          service_times: formData.service_times
        })
        .eq('id', currentChurch.id)

      if (error) throw error

      alert('✅ 교회 설정이 저장되었습니다!')
      
      // 현재 교회 정보 업데이트
      setCurrentChurch(prev => ({
        ...prev,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        theme_color: formData.theme_color,
        contact_info: formData.contact_info,
        service_times: formData.service_times
      }))

    } catch (error) {
      console.error('저장 오류:', error)
      alert('설정 저장 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInviteMember = async () => {
    if (!canEdit()) {
      alert('멤버를 초대할 권한이 없습니다.')
      return
    }

    if (!inviteEmail.trim()) {
      alert('이메일을 입력해주세요.')
      return
    }

    setInviting(true)

    try {
      // 실제로는 이메일 발송 시스템이 필요하지만, 
      // 지금은 간단히 사용자 ID를 직접 입력받는 방식으로 구현
      alert(`📧 ${inviteEmail}에게 초대 이메일이 발송됩니다!\n\n(실제 구현에서는 이메일 발송 시스템이 필요합니다)`)
      setInviteEmail('')
      
    } catch (error) {
      console.error('초대 오류:', error)
      alert('멤버 초대 중 오류가 발생했습니다.')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (membershipId, memberId) => {
    if (!canEdit()) {
      alert('멤버를 제거할 권한이 없습니다.')
      return
    }

    if (memberId === user.id) {
      alert('자기 자신은 제거할 수 없습니다.')
      return
    }

    if (confirm('정말 이 멤버를 제거하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('user_churches')
          .delete()
          .eq('id', membershipId)

        if (error) throw error

        alert('멤버가 제거되었습니다.')
        await loadChurchMembers(currentChurch.id)
      } catch (error) {
        console.error('멤버 제거 오류:', error)
        alert('멤버 제거 중 오류가 발생했습니다.')
      }
    }
  }

  const handleRoleChange = async (membershipId, newRole) => {
    if (!canEdit()) {
      alert('멤버 역할을 변경할 권한이 없습니다.')
      return
    }

    try {
      const { error } = await supabase
        .from('user_churches')
        .update({ role: newRole })
        .eq('id', membershipId)

      if (error) throw error

      alert('역할이 변경되었습니다.')
      await loadChurchMembers(currentChurch.id)
    } catch (error) {
      console.error('역할 변경 오류:', error)
      alert('역할 변경 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">설정 로딩중...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!currentChurch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">교회를 찾을 수 없습니다</h2>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', name: '기본 정보', icon: '📝' },
    { id: 'contact', name: '연락처', icon: '📞' },
    { id: 'service', name: '예배 시간', icon: '⏰' },
    { id: 'design', name: '디자인', icon: '🎨' },
    { id: 'members', name: '멤버 관리', icon: '👥' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold" style={{ color: currentChurch.theme_color }}>
                ⚙️ 교회 설정
              </h1>
              {userChurches.length > 1 && (
                <select 
                  className="px-3 py-2 border rounded-lg text-sm"
                  value={currentChurch.id}
                  onChange={(e) => handleChurchSwitch(e.target.value)}
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
              <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {getCurrentUserRole()}
              </span>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* 사이드바 탭 */}
          <div className="w-64 bg-white rounded-xl shadow-lg p-6">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 bg-white rounded-xl shadow-lg p-8">
            {/* 기본 정보 탭 */}
            {activeTab === 'basic' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 기본 정보</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      교회명
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!canEdit()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      교회 URL
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        minichurch.com/
                      </span>
                      <input
                        type="text"
                        value={formData.slug}
                        disabled
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg bg-gray-100 text-gray-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      URL은 변경할 수 없습니다
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      교회 소개
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={!canEdit()}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주소
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!canEdit()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 연락처 탭 */}
            {activeTab === 'contact' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📞 연락처 정보</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.contact_info.phone}
                      onChange={(e) => handleInputChange(e, 'contact_info')}
                      disabled={!canEdit()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.contact_info.email}
                      onChange={(e) => handleInputChange(e, 'contact_info')}
                      disabled={!canEdit()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      웹사이트
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.contact_info.website}
                      onChange={(e) => handleInputChange(e, 'contact_info')}
                      disabled={!canEdit()}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 예배 시간 탭 */}
            {activeTab === 'service' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">⏰ 예배 시간</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주일 1부 예배
                    </label>
                    <input
                      type="text"
                      name="sunday_1"
                      value={formData.service_times.sunday_1}
                      onChange={(e) => handleInputChange(e, 'service_times')}
                      disabled={!canEdit()}
                      placeholder="예: 오전 9시"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주일 2부 예배
                    </label>
                    <input
                      type="text"
                      name="sunday_2"
                      value={formData.service_times.sunday_2}
                      onChange={(e) => handleInputChange(e, 'service_times')}
                      disabled={!canEdit()}
                      placeholder="예: 오전 11시"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      수요 예배
                    </label>
                    <input
                      type="text"
                      name="wednesday"
                      value={formData.service_times.wednesday}
                      onChange={(e) => handleInputChange(e, 'service_times')}
                      disabled={!canEdit()}
                      placeholder="예: 저녁 7시"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      금요 기도회
                    </label>
                    <input
                      type="text"
                      name="friday"
                      value={formData.service_times.friday}
                      onChange={(e) => handleInputChange(e, 'service_times')}
                      disabled={!canEdit()}
                      placeholder="예: 저녁 7시 30분"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 디자인 탭 */}
            {activeTab === 'design' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🎨 디자인 설정</h2>
                <div className="space-y-6">
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
                        disabled={!canEdit()}
                        className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        value={formData.theme_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                        disabled={!canEdit()}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      미리보기
                    </label>
                    <div 
                      className="w-full p-8 rounded-lg border border-gray-300 text-white text-center"
                      style={{ backgroundColor: formData.theme_color }}
                    >
                      <h3 className="text-2xl font-bold mb-2">🏛️ {formData.name}</h3>
                      <p className="opacity-90">{formData.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 멤버 관리 탭 */}
            {activeTab === 'members' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">👥 멤버 관리</h2>
                
                {/* 멤버 초대 */}
                {canEdit() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">새 멤버 초대</h3>
                    <div className="flex gap-4">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="초대할 사용자의 이메일"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={handleInviteMember}
                        disabled={inviting}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {inviting ? '초대 중...' : '초대하기'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 멤버 목록 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    현재 멤버 ({members.length}명)
                  </h3>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {member.user_id === user.id ? '나' : 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              사용자 ID: {member.user_id}
                              {member.user_id === user.id && ' (나)'}
                            </p>
                            <p className="text-sm text-gray-500">
                              가입일: {new Date(member.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {canEdit() && member.user_id !== user.id ? (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => handleRemoveMember(member.id, member.user_id)}
                                className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                              >
                                제거
                              </button>
                            </>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              member.role === 'admin' ? 'bg-red-100 text-red-800' :
                              member.role === 'editor' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.role}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 권한 설명 */}
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">권한 설명</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span><strong>Admin:</strong> 모든 권한 (설정 변경, 멤버 관리, 설교 관리)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span><strong>Editor:</strong> 콘텐츠 관리 (설교 추가/수정/삭제)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      <span><strong>Viewer:</strong> 읽기 전용 (설교 보기만 가능)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            {canEdit() && activeTab !== 'members' && (
              <div className="flex justify-end pt-8 border-t border-gray-200 mt-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>설정 저장</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!canEdit() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
                <p className="text-yellow-800 text-sm">
                  ℹ️ 현재 권한으로는 설정을 변경할 수 없습니다. 관리자에게 문의하세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
