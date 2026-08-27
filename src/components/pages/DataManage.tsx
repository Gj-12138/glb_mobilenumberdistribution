'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, Search, Filter, RefreshCw, Trash2, MoreHorizontal, Plus, ArrowRightLeft, Recycle, ChevronLeft, ChevronRight, Phone, Zap, Clock, AlertCircle, Check, Tag, FileSpreadsheet, X } from 'lucide-react'
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

export function DataManage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PhoneStatus | ''>('')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importParsed, setImportParsed] = useState<string[]>([])
  const [importInvalid, setImportInvalid] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [distributeTo, setDistributeTo] = useState('')
  const [batchStatusOpen, setBatchStatusOpen] = useState(false)
  const [_batchStatus, setBatchStatus] = useState<PhoneStatus>('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [importSource, setImportSource] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  // Fetch data
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['phoneData', page, status, keyword, sourceFilter],
    queryFn: () => api.getPhoneData({ page, pageSize: PAGE_SIZE, status: status || undefined, keyword: keyword || undefined, source: sourceFilter || undefined }),
  })

  // Fetch user options for distribute
  const { data: userOptions } = useQuery({
    queryKey: ['userOptions'],
    queryFn: () => api.getUserOptions(),
  })

  // Fetch source options for filter
  const { data: sourceOptions } = useQuery({
    queryKey: ['sourceOptions'],
    queryFn: () => api.getSourceOptions(),
  })

  // Stats query (synced with keyword/source filters, single API call)
  const { data: statsData } = useQuery({
    queryKey: ['phoneDataStats', keyword, sourceFilter],
    queryFn: () => api.getPhoneDataStats({ keyword: keyword || undefined, source: sourceFilter || undefined }),
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: ({ phones, source }: { phones: string[]; source?: string }) => api.importPhones(phones, source),
    onSuccess: (res) => {
      toast({ title: '导入成功', description: `成功导入 ${res.data.count} 条数据` })
      setImportOpen(false)
      setImportFile(null)
      setImportParsed([])
      setImportInvalid([])
      setImportSource('')
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
      queryClient.invalidateQueries({ queryKey: ['sourceOptions'] })
    },
    onError: (err: Error) => {
      toast({ title: '导入失败', description: err.message })
    },
  })

  const handleImport = () => {
    importMutation.mutate({ phones: importParsed, source: importSource.trim() || undefined })
  }

  const handleImportDialogClose = (open: boolean) => {
    setImportOpen(open)
    if (!open) {
      setImportFile(null)
      setImportParsed([])
      setImportInvalid([])
      setImportSource('')
    }
  }

  // Distribute mutation
  const distributeMutation = useMutation({
    mutationFn: ({ ids, assignedTo }: { ids: number[]; assignedTo: number }) => api.distributePhones(ids, assignedTo),
    onSuccess: () => {
      toast({ title: '分发成功', description: `已分发 ${selected.size} 条数据` })
      setDistributeOpen(false)
      setDistributeTo('')
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '分发失败', description: err.message })
    },
  })

  // Auto distribute mutation
  const autoDistributeMutation = useMutation({
    mutationFn: () => api.autoDistribute(),
    onSuccess: () => {
      toast({ title: '自动分发成功', description: '待分发数据已平均分配' })
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '自动分发失败', description: err.message })
    },
  })

  // Recycle mutation
  const recycleMutation = useMutation({
    mutationFn: (ids: number[]) => api.recyclePhones(ids),
    onSuccess: () => {
      toast({ title: '回收成功', description: `已回收 ${selected.size} 条数据` })
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '回收失败', description: err.message })
    },
  })

  // Update single status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updatePhoneStatus(id, status),
    onSuccess: () => {
      toast({ title: '状态更新成功' })
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
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
      setBatchStatus('pending')
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '批量更新失败', description: err.message })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePhoneData(id),
    onSuccess: () => {
      toast({ title: '删除成功' })
      setDeleteOpen(false)
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
    },
    onError: (err: Error) => {
      toast({ title: '删除失败', description: err.message })
    },
  })

  // Batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.batchDeletePhoneData(ids),
    onSuccess: (res) => {
      toast({ title: '批量删除成功', description: `已删除 ${res.data.count} 条数据` })
      setBatchDeleteOpen(false)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['phoneData'] })
      queryClient.invalidateQueries({ queryKey: ['phoneDataStats'] })
      queryClient.invalidateQueries({ queryKey: ['sourceOptions'] })
    },
    onError: (err: Error) => {
      toast({ title: '批量删除失败', description: err.message })
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

  const handleSourceFilter = (val: string) => {
    setSourceFilter(val === '_all' ? '' : val)
    setPage(1)
    setSelected(new Set())
  }

  const handleReset = () => {
    setStatus('')
    setKeyword('')
    setSearchInput('')
    setSourceFilter('')
    setPage(1)
    setSelected(new Set())
  }

  const parsePhones = useCallback((phones: (string | number)[]) => {
    const valid: string[] = []
    const invalid: string[] = []
    phones.forEach((raw) => {
      const p = String(raw).trim()
      if (/^1\d{10}$/.test(p)) {
        valid.push(p)
      } else if (p) {
        invalid.push(p)
      }
    })
    setImportParsed(valid)
    setImportInvalid(invalid)
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setImportFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
        // Extract all values from column A, flatten in case of nested arrays
        const phones = rows.map((row) => row[0]).filter((v) => v !== undefined && v !== null)
        parsePhones(phones)
      } catch {
        setImportParsed([])
        setImportInvalid([])
      }
    }
    reader.readAsArrayBuffer(file)
  }, [parsePhones])

  const handleDropZoneClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const clearFile = () => {
    setImportFile(null)
    setImportParsed([])
    setImportInvalid([])
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
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总数据</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">未跟进</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已打通</p>
              <p className="text-2xl font-bold">{stats.connected}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">打不通</p>
              <p className="text-2xl font-bold">{stats.unreachable}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value || '_all'}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter || '_all'} onValueChange={handleSourceFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="全部来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">全部来源</SelectItem>
                {(sourceOptions?.data || []).map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
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
              <Button variant="outline" onClick={handleSearch} size="default">
                <Search className="w-4 h-4 mr-1.5" />搜索
              </Button>
              <Button variant="ghost" onClick={handleReset} size="default">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setImportFile(null); setImportParsed([]); setImportInvalid([]); setImportSource(''); setImportOpen(true) }}>
            <Upload className="w-4 h-4 mr-1.5" />导入数据
          </Button>
          <Button variant="outline" onClick={() => autoDistributeMutation.mutate()} disabled={autoDistributeMutation.isPending}>
            <Zap className="w-4 h-4 mr-1.5" />自动分发
          </Button>
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => { setDistributeTo(''); setDistributeOpen(true) }}
          >
            <ArrowRightLeft className="w-4 h-4 mr-1.5" />分发
            {selected.size > 0 && <Badge variant="secondary" className="ml-1.5">{selected.size}</Badge>}
          </Button>
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => recycleMutation.mutate(Array.from(selected))}
          >
            <Recycle className="w-4 h-4 mr-1.5" />回收
            {selected.size > 0 && <Badge variant="secondary" className="ml-1.5">{selected.size}</Badge>}
          </Button>
          <DropdownMenu open={batchStatusOpen} onOpenChange={setBatchStatusOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={selected.size === 0}>
                <Filter className="w-4 h-4 mr-1.5" />批量状态
                {selected.size > 0 && <Badge variant="secondary" className="ml-1.5">{selected.size}</Badge>}
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
          <Button
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => setBatchDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />批量删除
            {selected.size > 0 && <Badge variant="secondary" className="ml-1.5">{selected.size}</Badge>}
          </Button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">分配给</th>
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
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
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
                      <span className="phone-mono text-sm">{item.phone}</span>
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
                    <td className="px-4 py-3 text-sm">{item.assignedUser?.nickname || '-'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.assignedAt ? new Date(item.assignedAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.followedUpAt ? new Date(item.followedUpAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => { setDeleteId(item.id); setDeleteOpen(true) }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={handleImportDialogClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>导入手机号数据</DialogTitle>
            <DialogDescription>上传 Excel 文件（.xlsx / .xls），文件中仅包含手机号一列，无表头。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">来源标签</label>
              <Input
                placeholder="请输入数据来源，如：广告投放、老客户推荐..."
                value={importSource}
                onChange={(e) => setImportSource(e.target.value)}
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInputChange}
            />
            {!importFile ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={handleDropZoneClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">点击或拖拽上传 Excel 文件</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 .xlsx / .xls 格式</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{importFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={clearFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {importParsed.length > 0 && (
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600 font-medium">有效: {importParsed.length} 条</span>
                {importInvalid.length > 0 && (
                  <span className="text-red-600 font-medium">无效: {importInvalid.length} 条</span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleImportDialogClose(false)}>取消</Button>
            <Button
              onClick={handleImport}
              disabled={importParsed.length === 0 || importMutation.isPending}
            >
              {importMutation.isPending ? '导入中...' : `确认导入 ${importParsed.length} 条`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribute Dialog */}
      <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>分发数据</DialogTitle>
            <DialogDescription>将选中的 {selected.size} 条数据分配给指定用户</DialogDescription>
          </DialogHeader>
          <div>
            <Select value={distributeTo} onValueChange={setDistributeTo}>
              <SelectTrigger>
                <SelectValue placeholder="选择用户" />
              </SelectTrigger>
              <SelectContent>
                {userOptions?.data?.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.nickname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistributeOpen(false)}>取消</Button>
            <Button
              onClick={() => distributeMutation.mutate({ ids: Array.from(selected), assignedTo: Number(distributeTo) })}
              disabled={!distributeTo || distributeMutation.isPending}
            >
              {distributeMutation.isPending ? '分发中...' : '确认分发'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>删除后数据无法恢复，确定要删除这条数据吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-white hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除选中的 {selected.size} 条数据吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchDeleteMutation.mutate(Array.from(selected))}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={batchDeleteMutation.isPending}
            >
              {batchDeleteMutation.isPending ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}