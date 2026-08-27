'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, RefreshCw, Trash2, Edit, ChevronLeft, ChevronRight, Shield, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import type { UserInfo } from '@/types'

const PAGE_SIZE = 20

export function AccountManage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetPwOpen, setResetPwOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Form states
  const [addForm, setAddForm] = useState({ username: '', password: '', nickname: '', role: 'user' })
  const [editUser, setEditUser] = useState<UserInfo | null>(null)
  const [editForm, setEditForm] = useState({ nickname: '', role: '' })
  const [resetUser, setResetUser] = useState<UserInfo | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [deleteUser, setDeleteUser] = useState<UserInfo | null>(null)
  const [showPasswords, setShowPasswords] = useState<Set<number>>(new Set())

  // Fetch users
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['users', page, keyword],
    queryFn: () => api.getUsers({ page, pageSize: PAGE_SIZE, keyword: keyword || undefined }),
  })

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (form: { username: string; password: string; nickname: string; role: string }) => api.createUser(form),
    onSuccess: () => {
      toast({ title: '创建成功' })
      setAddOpen(false)
      setAddForm({ username: '', password: '', nickname: '', role: 'user' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => {
      toast({ title: '创建失败', description: err.message })
    },
  })

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nickname?: string; role?: string } }) => api.updateUser(id, data),
    onSuccess: () => {
      toast({ title: '更新成功' })
      setEditOpen(false)
      setEditUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => {
      toast({ title: '更新失败', description: err.message })
    },
  })

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => api.updateUserStatus(id, status),
    onSuccess: () => {
      toast({ title: '状态更新成功' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => {
      toast({ title: '状态更新失败', description: err.message })
    },
  })

  // Reset password mutation
  const resetPwMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => api.resetPassword(id, password),
    onSuccess: () => {
      toast({ title: '密码重置成功' })
      setResetPwOpen(false)
      setResetUser(null)
      setResetPassword('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => {
      toast({ title: '密码重置失败', description: err.message })
    },
  })

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      toast({ title: '删除成功' })
      setDeleteOpen(false)
      setDeleteUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: Error) => {
      toast({ title: '删除失败', description: err.message })
    },
  })

  const handleSearch = () => {
    setKeyword(searchInput)
    setPage(1)
  }

  const handleReset = () => {
    setKeyword('')
    setSearchInput('')
    setPage(1)
  }

  const openEdit = (user: UserInfo) => {
    setEditUser(user)
    setEditForm({ nickname: user.nickname, role: user.role })
    setEditOpen(true)
  }

  const openResetPw = (user: UserInfo) => {
    setResetUser(user)
    setResetPassword('')
    setResetPwOpen(true)
  }

  const openDelete = (user: UserInfo) => {
    setDeleteUser(user)
    setDeleteOpen(true)
  }

  const totalPages = data?.data ? Math.max(1, Math.ceil(data.data.total / PAGE_SIZE)) : 1
  const items = (data?.data?.list || []) as UserInfo[]

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="搜索用户名或昵称..."
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
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />添加用户
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
          <table className="w-full data-table">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">用户名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">密码</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">昵称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">创建时间</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                items.map((item: UserInfo) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium">{item.username}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="phone-mono text-sm">
                          {showPasswords.has(item.id) ? (item.passwordText || '-') : '••••••'}
                        </span>
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => {
                            const next = new Set(showPasswords)
                            if (next.has(item.id)) { next.delete(item.id) } else { next.add(item.id) }
                            setShowPasswords(next)
                          }}
                        >
                          {showPasswords.has(item.id)
                            ? <EyeOff className="w-3.5 h-3.5" />
                            : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.nickname}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                        <Shield className="w-3 h-3" />
                        {item.role === 'admin' ? '管理员' : '用户'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.status === 1}
                          onCheckedChange={(checked) =>
                            toggleStatusMutation.mutate({ id: item.id, status: checked ? 1 : 0 })
                          }
                          disabled={item.id === currentUser?.id}
                        />
                        <span className={`text-xs ${item.status === 1 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {item.status === 1 ? '正常' : '禁用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(item)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openResetPw(item)}>
                          <Shield className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => openDelete(item)}
                          disabled={item.id === currentUser?.id}
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

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
            <DialogDescription>创建新的系统用户</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input
                placeholder="请输入用户名"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input
                placeholder="请输入昵称"
                value={addForm.nickname}
                onChange={(e) => setAddForm({ ...addForm, nickname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={addForm.role} onValueChange={(val) => setAddForm({ ...addForm, role: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button
              onClick={() => createMutation.mutate(addForm)}
              disabled={!addForm.username || !addForm.password || !addForm.nickname || createMutation.isPending}
            >
              {createMutation.isPending ? '创建中...' : '确认创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息（用户名: {editUser?.username}）</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({ ...editForm, role: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button
              onClick={() => editUser && updateMutation.mutate({ id: editUser.id, data: editForm })}
              disabled={!editForm.nickname || updateMutation.isPending}
            >
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>为用户 {resetUser?.nickname} 设置新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input
                type="password"
                placeholder="请输入新密码（至少6位）"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwOpen(false)}>取消</Button>
            <Button
              onClick={() => resetUser && resetPwMutation.mutate({ id: resetUser.id, password: resetPassword })}
              disabled={resetPassword.length < 6 || resetPwMutation.isPending}
            >
              {resetPwMutation.isPending ? '重置中...' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 &quot;{deleteUser?.nickname}&quot; 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}