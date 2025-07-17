'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (!session) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              SEO記事生成システム
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                ダッシュボード
              </Link>
              <Link href="/sites" className="text-gray-700 hover:text-blue-600 transition-colors">
                サイト管理
              </Link>
              <Link href="/articles" className="text-gray-700 hover:text-blue-600 transition-colors">
                記事管理
              </Link>
              <Link href="/usage" className="text-gray-700 hover:text-blue-600 transition-colors">
                利用状況
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Card className="px-3 py-1">
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
            </Card>
            
            <Button variant="outline" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}