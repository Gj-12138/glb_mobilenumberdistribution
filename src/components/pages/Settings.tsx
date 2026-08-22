'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth-store'
import { Shield } from 'lucide-react'

export function SettingsPage() {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) => api.changePassword(data.oldPassword, data.newPassword),
    onSuccess: () => {
      toast({ title: '密码修改成功', description: '请使用新密码重新登录' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      setTimeout(() => {
        const { logout } = useAuthStore.getState()
        logout()
      }, 1500)
    },
    onError: (err: Error) => {
      toast({ title: '密码修改失败', description: err.message })
    },
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!oldPassword) newErrors.oldPassword = '请输入当前密码'
    if (!newPassword) newErrors.newPassword = '请输入新密码'
    else if (newPassword.length < 6) newErrors.newPassword = '新密码至少6位'
    if (!confirmPassword) newErrors.confirmPassword = '请确认新密码'
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = '两次输入的密码不一致'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate({ oldPassword, newPassword })
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* User info card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">账号信息</CardTitle>
          <CardDescription>当前登录账号的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {user?.nickname?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.nickname}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">@{user?.username}</span>
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  {user?.role === 'admin' ? '管理员' : '用户'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">修改密码</CardTitle>
          <CardDescription>修改密码后需要重新登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="old-pw">当前密码</Label>
              <Input
                id="old-pw"
                type="password"
                placeholder="请输入当前密码"
                value={oldPassword}
                onChange={(e) => { setOldPassword(e.target.value); setErrors({ ...errors, oldPassword: '' }) }}
                className={errors.oldPassword ? 'border-destructive' : ''}
                autoComplete="current-password"
              />
              {errors.oldPassword && <p className="text-xs text-destructive">{errors.oldPassword}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">新密码</Label>
              <Input
                id="new-pw"
                type="password"
                placeholder="请输入新密码（至少6位）"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors({ ...errors, newPassword: '' }) }}
                className={errors.newPassword ? 'border-destructive' : ''}
                autoComplete="new-password"
              />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">确认新密码</Label>
              <Input
                id="confirm-pw"
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }) }}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? '提交中...' : '确认修改'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}