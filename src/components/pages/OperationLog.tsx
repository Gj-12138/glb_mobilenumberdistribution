'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { OPER_TYPE_LABELS, type OperType, type LogItem } from '@/types'

const PAGE_SIZE = 20

const OPER_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'login', label: '登录' },
  { value: 'import', label: '导入数据' },
  { value: 'distribute', label: '分发数据' },
  { value: 'recycle', label: '回收数据' },
  { value: 'status_change', label: '状态变更' },
]

const OPER_TYPE_COLORS: Record<OperType, string> = {
  login: 'bg-blue-50 text-blue-700 border border-blue-200',
  import: 'bg-violet-50 text-violet-700 border border-violet-200',
  distribute: 'bg-amber-50 text-amber-700 border border-amber-200',
  recycle: 'bg-orange-50 text-orange-700 border border-orange-200',
  status_change: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export function OperationLog() {
  const [page, setPage] = useState(1)
  const [operType, setOperType] = useState<OperType | ''>('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['logs', page, operType, keyword],
    queryFn: () => api.getLogs({ page, pageSize: PAGE_SIZE, operType: operType || undefined, keyword: keyword || undefined }),
  })

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(1)
  }

  const handleOperTypeFilter = (val: string) => {
    setOperType(val === '_all' ? '' : (val as OperType))
    setPage(1)
  }

  const handleReset = () => {
    setOperType('')
    setKeyword('')
    setSearchInput('')
    setPage(1)
  }

  const totalPages = data?.data ? Math.max(1, Math.ceil(data.data.total / PAGE_SIZE)) : 1
  const items = (data?.data?.list || []) as LogItem[]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={operType} onValueChange={handleOperTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              {OPER_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || '_all'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="搜索操作人或详情..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-1.5" />搜索
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
          <table className="w-full data-table">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-16">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">操作人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">操作类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">详情</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                items.map((item: LogItem) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.userNickname}</td>
                    <td className="px-4 py-3">
                      <span className={OPER_TYPE_COLORS[item.operType] + ' px-2.5 py-0.5 rounded-full text-xs font-medium'}>
                        {OPER_TYPE_LABELS[item.operType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                      {item.operContent || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.operTime).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && data?.data && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              共 {data.data.total} 条，第 {page}/{totalPages} 页
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
