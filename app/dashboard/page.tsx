'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface DashboardStats {
  sitesCount: number
  outlinesCount: number
  articlesCount: number
  totalTokens: number
  monthlyTokens: number
  tokenLimit: number
}

export default function DashboardPage() {
  const { data: session } = useSession()

  const { data: stats, isLoading } = useQuery<DashboardStats>(
    'dashboard-stats',
    async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('統計情報の取得に失敗しました')
      return response.json()
    },
    {
      enabled: !!session
    }
  )

  const { data: sites } = useQuery(
    'recent-sites',
    async () => {
      const response = await fetch('/api/sites?limit=3')
      if (!response.ok) throw new Error('サイト情報の取得に失敗しました')
      return response.json()
    },
    {
      enabled: !!session
    }
  )

  const { data: recentArticles } = useQuery(
    'recent-articles',
    async () => {
      const response = await fetch('/api/articles?limit=5')
      if (!response.ok) throw new Error('記事情報の取得に失敗しました')
      return response.json()
    },
    {
      enabled: !!session
    }
  )

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2">
            ようこそ、{session.user?.name || session.user?.email}さん
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                管理サイト数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isLoading ? '...' : formatNumber(stats?.sitesCount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                記事概要数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : formatNumber(stats?.outlinesCount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                生成記事数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {isLoading ? '...' : formatNumber(stats?.articlesCount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                月間トークン使用量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? '...' : 
                  `${Math.round(((stats?.monthlyTokens || 0) / (stats?.tokenLimit || 1)) * 100)}%`
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumber(stats?.monthlyTokens || 0)} / {formatNumber(stats?.tokenLimit || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>
              よく使用する機能にすばやくアクセス
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/sites/new">
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl">🌐</span>
                  <span>新しいサイトを追加</span>
                </Button>
              </Link>
              
              <Link href="/articles/generate">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl">✍️</span>
                  <span>記事を生成</span>
                </Button>
              </Link>
              
              <Link href="/articles">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl">📄</span>
                  <span>記事を管理</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近のサイト */}
          <Card>
            <CardHeader>
              <CardTitle>最近のサイト</CardTitle>
              <CardDescription>
                最近更新されたサイト
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sites && sites.length > 0 ? (
                <div className="space-y-4">
                  {sites.slice(0, 3).map((site: any) => (
                    <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{site.name}</h4>
                        <p className="text-sm text-gray-600">{site.url}</p>
                        <p className="text-xs text-gray-500">
                          更新: {formatDate(site.updatedAt)}
                        </p>
                      </div>
                      <Link href={`/sites/${site.id}`}>
                        <Button variant="outline" size="sm">
                          管理
                        </Button>
                      </Link>
                    </div>
                  ))}
                  <Link href="/sites">
                    <Button variant="ghost" className="w-full">
                      すべてのサイトを見る →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">まだサイトがありません</p>
                  <Link href="/sites/new">
                    <Button>最初のサイトを追加</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近の記事 */}
          <Card>
            <CardHeader>
              <CardTitle>最近の記事</CardTitle>
              <CardDescription>
                最近生成された記事
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentArticles && recentArticles.length > 0 ? (
                <div className="space-y-4">
                  {recentArticles.slice(0, 5).map((article: any) => (
                    <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{article.outline.title}</h4>
                        <p className="text-xs text-gray-600">
                          {article.outline.site.name} | {article.language}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(article.createdAt)}
                        </p>
                      </div>
                      <Link href={`/articles/${article.id}`}>
                        <Button variant="outline" size="sm">
                          表示
                        </Button>
                      </Link>
                    </div>
                  ))}
                  <Link href="/articles">
                    <Button variant="ghost" className="w-full">
                      すべての記事を見る →
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">まだ記事がありません</p>
                  <Link href="/articles/generate">
                    <Button>記事を生成</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}