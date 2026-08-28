'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/auth-store'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, Users, FileText, Settings, LogOut, LayoutDashboard, Menu, X, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { UserInfo, PageKey } from '@/types'
import { DataManage } from './DataManage'
import { MyData } from './MyData'
import { AccountManage } from './AccountManage'
import { OperationLog } from './OperationLog'
import { SettingsPage } from './Settings'

const ADMIN_NAV = [
  { key: 'data-manage' as PageKey, icon: Phone, label: '数据管理' },
  { key: 'my-data' as PageKey, icon: LayoutDashboard, label: '我的数据' },
  { key: 'account' as PageKey, icon: Users, label: '账号管理' },
  { key: 'log' as PageKey, icon: FileText, label: '操作日志' },
  { key: 'settings' as PageKey, icon: Settings, label: '个人设置' },
]

const USER_NAV = [
  { key: 'my-data' as PageKey, icon: LayoutDashboard, label: '我的数据' },
  { key: 'settings' as PageKey, icon: Settings, label: '个人设置' },
]

const PAGE_TITLES: Record<PageKey, string> = {
  'data-manage': '数据管理',
  'my-data': '我的数据',
  'account': '账号管理',
  'log': '操作日志',
  'settings': '个人设置',
}

interface MainLayoutProps {
  user: UserInfo
  onLogout: () => void
}

export function MainLayout({ user, onLogout }: MainLayoutProps) {
  const { currentPage, setCurrentPage } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = user.role === 'admin' ? ADMIN_NAV : USER_NAV

  const handleLogout = () => {
    onLogout()
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'data-manage': return <DataManage />
      case 'my-data': return <MyData />
      case 'account': return <AccountManage />
      case 'log': return <OperationLog />
      case 'settings': return <SettingsPage />
      default: return <DataManage />
    }
  }

  const sidebarContent = (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[var(--sidebar-accent)] flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-[var(--sidebar-primary)]" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-[var(--sidebar-foreground)] truncate">
              手机号分发系统
            </span>
          )}
        </div>

        <Separator className="bg-[var(--sidebar-border)]" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentPage === item.key
            const btn = (
              <button
                key={item.key}
                onClick={() => {
                  setCurrentPage(item.key)
                  setMobileOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${collapsed ? 'justify-center px-2' : ''}
                  ${isActive
                    ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
                    : 'text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-accent)]/50 hover:text-[var(--sidebar-foreground)]'
                  }
                `}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
            if (collapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return btn
          })}
        </nav>

        <Separator className="bg-[var(--sidebar-border)]" />

        {/* User footer */}
        <div className="px-3 py-4 shrink-0">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-[var(--sidebar-accent)] text-[var(--sidebar-primary)] text-xs font-semibold">
                {user.nickname?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--sidebar-foreground)] truncate">{user.nickname}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[var(--sidebar-border)] text-[var(--sidebar-foreground)]/60 bg-transparent">
                    {user.role === 'admin' ? '管理员' : '用户'}
                  </Badge>
                </div>
              </div>
            )}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleLogout} className="p-2 rounded-lg text-[var(--sidebar-foreground)]/60 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>退出登录</TooltipContent>
              </Tooltip>
            ) : (
              <button onClick={handleLogout} className="p-2 rounded-lg text-[var(--sidebar-foreground)]/60 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - desktop */}
      <aside className={`
        fixed left-0 top-0 h-screen z-50 bg-[var(--sidebar)] transition-all duration-300 hidden lg:block
        ${collapsed ? 'w-16' : 'w-60'}
      `}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors z-10"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar - mobile drawer */}
      <aside className={`
        fixed left-0 top-0 h-screen z-50 bg-[var(--sidebar)] w-60 transition-transform duration-300 lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'} min-h-screen flex flex-col`}>
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{PAGE_TITLES[currentPage]}</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}