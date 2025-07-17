'use client'

import { useQuery } from 'react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, calculateUsagePercentage, getUsageColor } from '@/lib/utils'

export default function UsagePage() {
  const { data: stats, isLoading } = useQuery(
    'usage-stats',
    async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('利用統計の取得に失敗しました')
      return response.json()
    }
  )

  const { data: dailyUsage } = useQuery(
    'daily-usage',
    async () => {
      const response = await fetch('/api/usage/daily')
      if (!response.ok) throw new Error('日別利用データの取得に失敗しました')
      return response.json()
    }
  )

  const { data: serviceUsage } = useQuery(
    'service-usage',
    async () => {
      const response = await fetch('/api/usage/by-service')
      if (!response.ok) throw new Error('サービス別利用データの取得に失敗しました')
      return response.json()
    }
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </DashboardLayout>
    )
  }

  const usagePercentage = stats ? calculateUsagePercentage(stats.monthlyTokens, stats.tokenLimit) : 0
  const usageColorClass = getUsageColor(usagePercentage)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            利用状況
          </h1>
          <p className="text-gray-600 mt-2">
            トークン使用量とサービス利用状況を確認できます
          </p>
        </div>

        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                月間使用量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${usageColorClass}`}>
                {formatNumber(stats?.monthlyTokens || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                / {formatNumber(stats?.tokenLimit || 0)} トークン
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    usagePercentage < 50 ? 'bg-green-500' : 
                    usagePercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                累計使用量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats?.totalTokens || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                全期間累計
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                使用率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${usageColorClass}`}>
                {usagePercentage}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                月間制限に対する割合
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                残り使用可能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(Math.max(0, (stats?.tokenLimit || 0) - (stats?.monthlyTokens || 0)))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                今月残りトークン
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 使用量の詳細 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AIサービス別使用量 */}
          <Card>
            <CardHeader>
              <CardTitle>AIサービス別使用量</CardTitle>
              <CardDescription>
                今月のサービス別トークン使用量
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceUsage ? (
                <div className="space-y-4">
                  {Object.entries(serviceUsage).map(([service, usage]: [string, any]) => {
                    const serviceNames: { [key: string]: string } = {
                      'gpt-4': 'GPT-4',
                      'claude': 'Claude Sonnet',
                      'gemini': 'Gemini Pro'
                    }
                    const serviceName = serviceNames[service] || service
                    const percentage = stats?.monthlyTokens ? (usage / stats.monthlyTokens) * 100 : 0

                    return (
                      <div key={service} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{serviceName}</span>
                            <span className="text-sm text-gray-600">
                              {formatNumber(usage)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  データがありません
                </div>
              )}
            </CardContent>
          </Card>

          {/* 日別使用量グラフ */}
          <Card>
            <CardHeader>
              <CardTitle>日別使用量</CardTitle>
              <CardDescription>
                過去30日間の使用量推移
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyUsage && dailyUsage.length > 0 ? (
                <div className="space-y-2">
                  {dailyUsage.slice(-10).map((day: any, index: number) => {
                    const date = new Date(day.date).toLocaleDateString('ja-JP', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                    const maxUsage = Math.max(...dailyUsage.map((d: any) => d.tokensUsed))
                    const percentage = maxUsage > 0 ? (day.tokensUsed / maxUsage) * 100 : 0

                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-16 text-sm text-gray-600">
                          {date}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-sm text-right text-gray-600">
                          {formatNumber(day.tokensUsed)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  データがありません
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 制限とアラート */}
        <Card>
          <CardHeader>
            <CardTitle>制限とアラート</CardTitle>
            <CardDescription>
              利用制限の設定と現在の状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">月間制限</h4>
                  <p className="text-sm text-gray-600">
                    毎月のトークン使用量上限
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatNumber(stats?.tokenLimit || 0)} トークン
                  </div>
                  <div className="text-sm text-gray-600">
                    現在 {usagePercentage}% 使用中
                  </div>
                </div>
              </div>

              {usagePercentage >= 80 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-orange-600 mr-3">⚠️</div>
                    <div>
                      <h4 className="font-medium text-orange-800">
                        使用量が80%を超えています
                      </h4>
                      <p className="text-sm text-orange-700">
                        制限に達すると記事生成が一時停止されます。使用量にご注意ください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {usagePercentage >= 100 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-red-600 mr-3">🚫</div>
                    <div>
                      <h4 className="font-medium text-red-800">
                        月間制限に達しました
                      </h4>
                      <p className="text-sm text-red-700">
                        来月まで記事生成機能が利用できません。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}