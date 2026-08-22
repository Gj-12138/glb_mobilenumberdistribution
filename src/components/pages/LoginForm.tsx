'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast({ title: '提示', description: '请输入用户名和密码' })
      return
    }
    setLoading(true)
    try {
      const res = await api.login(username.trim(), password)
      setAuth(res.data.token, res.data.user)
      toast({ title: '登录成功', description: `欢迎回来，${res.data.user.nickname}` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败'
      toast({ title: '登录失败', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[480px] flex-col items-center justify-center bg-[var(--sidebar)] text-[var(--sidebar-foreground)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full border border-white/20" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white/15" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 px-12">
          <div className="w-20 h-20 rounded-2xl bg-[var(--sidebar-accent)] flex items-center justify-center">
            <Phone className="w-10 h-10 text-[var(--sidebar-primary)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-center">手机号数据分发系统</h1>
          <p className="text-[var(--sidebar-foreground)]/70 text-center text-base leading-relaxed max-w-xs">
            高效管理手机号数据，智能分发与跟进追踪，助力团队协作与数据治理
          </p>
          <div className="flex items-center gap-6 mt-8 text-sm text-[var(--sidebar-foreground)]/50">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>智能分发</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>状态追踪</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <div className="lg:hidden flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-bold">手机号数据分发系统</h1>
                </div>
                <h2 className="text-2xl font-semibold">欢迎登录</h2>
                <p className="text-muted-foreground text-sm">请输入您的账号和密码</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="h-11 w-full mt-2" disabled={loading}>
                  {loading && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />}
                  {loading ? '登录中...' : '登 录'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}