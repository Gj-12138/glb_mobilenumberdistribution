'use client'

import { useEffect, useSyncExternalStore, useRef } from 'react'
import { useAuthStore, useAppStore } from '@/store/auth-store'
import { api } from '@/api/client'
import { LoginForm } from '@/components/pages/LoginForm'
import { MainLayout } from '@/components/pages/MainLayout'

const emptySubscribe = () => () => {}

export default function Page() {
  const { token, user, setAuth, logout } = useAuthStore()
  const restoring = useRef(false)
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const ready = !token || !!user

  useEffect(() => {
    if (token && !user && !restoring.current) {
      restoring.current = true
      api.getMe().then((res) => {
        setAuth(token, res.data)
        const { setCurrentPage } = useAppStore.getState()
        setCurrentPage(res.data.role === 'admin' ? 'data-manage' : 'my-data')
      }).catch(() => {
        logout()
      })
    }
  }, [token, user, setAuth, logout])

  if (!isClient || !ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <MainLayout user={user} onLogout={logout} />
}
