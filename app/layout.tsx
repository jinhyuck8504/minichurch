import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '미니처치 - 싸이월드 미니홈피처럼 쉬운 교회 홈페이지',
  description: 'IT 전문가? 필요 없어요. 10분 만에 만드는 우리 교회 홈페이지',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
