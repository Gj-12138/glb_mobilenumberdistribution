'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, RefreshCw, Filter, ChevronLeft, ChevronRight, Phone, Clock, AlertCircle, Check, Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { STATUS_LABELS, STATUS_COLORS, type PhoneStatus, type PhoneDataItem } from '@/types'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '未跟进' },
  { value: 'no_answer', label: '无人接听' },
  { value: 'unreachable', label: '打不通' },
  { value: 'connected', label: '已打通' },
]

export function MyData() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PhoneStatus | ''>('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [batchStatusOpen, setBatchStatusOpen] = useState(false)

  // Fetch my data
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['myPhoneData', page, status, keyword],
    queryFn: () => api.getMyPhoneData({ page, pageSize: PAGE_SIZE, status: status || undefined, keyword: keyword || undefined }),
  })

  // Stats query
  const { data: statsData } = useQuery({
    queryKey: ['myPhoneDataStats', keyword],
    queryFn: () => api.getMyPhoneDataStats({ keyword: keyword || undefined }),
  })

  // Update single status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updatePhoneStatus(id, status),
    onSuccess: () => {
      toast({ title: '状态更新成功' })
      queryClient.invalidateQueries({ queryKey: ['myPhoneData'] })
      queryClient.invalidateQueries({ queryKey: ['myPhoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '状态更新失败', description: err.message })
    },
  })

  // Batch status update mutation
  const batchStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) => api.batchUpdateStatus(ids, status),
    onSuccess: () => {
      toast({ title: '批量更新成功', description: `已更新 ${selected.size} 条数据状态` })
      setBatchStatusOpen(false)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['myPhoneData'] })
      queryClient.invalidateQueries({ queryKey: ['myPhoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '批量更新失败', description: err.message })
    },
  })

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(1)
    setSelected(new Set())
  }

  const handleStatusFilter = (val: string) => {
    setStatus(val === '_all' ? '' : (val as PhoneStatus))
    setPage(1)
    setSelected(new Set())
  }

  const handleReset = () => {
    setStatus('')
    setKeyword('')
    setSearchInput('')
    setPage(1)
    setSelected(new Set())
  }

  const toggleSelectAll = () => {
    if (!data?.data.list) return
    const allIds = data.data.list.map((d: PhoneDataItem) => d.id)
    if (selected.size === allIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const totalPages = data?.data ? Math.max(1, Math.ceil(data.data.total / PAGE_SIZE)) : 1
  const items = (data?.data?.list || []) as PhoneDataItem[]

  const stats = statsData?.data || { total: 0, pending: 0, connected: 0, unreachable: 0 }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">分配总数</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">未跟进</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">已打通</p>
            <p className="text-2xl font-bold">{stats.connected}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">打不通</p>
            <p className="text-2xl font-bold">{stats.unreachable}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={status} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || '_all'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="搜索手机号或姓名..."
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

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <DropdownMenu open={batchStatusOpen} onOpenChange={setBatchStatusOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={selected.size === 0}>
                <Filter className="w-4 h-4 mr-1.5" />批量状态
                {selected.size > 0 && <span className="ml-1.5 text-xs bg-secondary px-1.5 py-0.5 rounded-full">{selected.size}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(['pending', 'no_answer', 'unreachable', 'connected'] as PhoneStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => batchStatusMutation.mutate({ ids: Array.from(selected), status: s })}
                  disabled={batchStatusMutation.isPending}
                >
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isFetching && !isLoading && (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" />刷新中...
          </span>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
          <table className="w-full data-table">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox
                    checked={items.length > 0 && selected.size === items.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">手机号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">来源</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">分配时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">跟进时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                items.map((item: PhoneDataItem) => (
                  <tr key={item.id} className={selected.has(item.id) ? 'bg-primary/5' : ''}>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="phone-mono text-sm cursor-pointer select-none hover:text-primary transition-colors"
                        onDoubleClick={() => {
                          navigator.clipboard.writeText(item.phone).then(() => {
                            toast({ title: '已复制', description: item.phone })
                          })
                        }}
                        title="双击复制"
                      >
                        {item.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.name || '-'}</td>
                    <td className="px-4 py-3">
                      {item.source ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                          <Tag className="w-3 h-3" />{item.source}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_COLORS[item.status] + ' px-2.5 py-0.5 rounded-full text-xs font-medium'}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.assignedAt ? new Date(item.assignedAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.followedUpAt ? new Date(item.followedUpAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <Filter className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(['pending', 'no_answer', 'unreachable', 'connected'] as PhoneStatus[]).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: s })}
                              disabled={updateStatusMutation.isPending}
                            >
                              {STATUS_LABELS[s]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); setSelected(new Set()) }}>
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
                    onClick={() => { setPage(pageNum); setSelected(new Set()) }}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => { setPage(page + 1); setSelected(new Set()) }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
