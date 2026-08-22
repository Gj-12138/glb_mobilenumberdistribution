'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth-store'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Phone, Zap, Shield, Eye, EyeOff, Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/* ──────────────────────── animation variants ──────────────────────── */
const leftPanelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const slideFromLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

const rightPanelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const slideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

/* ──────────────────────── feature items ──────────────────────── */
const features = [
  { icon: Zap, title: '智能分发', desc: '自动平均分配数据' },
  { icon: Activity, title: '状态追踪', desc: '实时跟进状态管理' },
  { icon: Shield, title: '数据安全', desc: '角色权限精细控制' },
]

/* ──────────────────────── component ──────────────────────── */
export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
      {/* ==================== MOBILE HEADER ==================== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--sidebar)] flex items-center px-4 gap-3 shadow-lg shadow-black/20">
        <div className="w-8 h-8 rounded-lg bg-[var(--sidebar-accent)] flex items-center justify-center">
          <Phone className="w-4 h-4 text-[var(--sidebar-primary)]" />
        </div>
        <span className="text-sm font-semibold text-[var(--sidebar-foreground)]">手机号数据分发系统</span>
      </div>

      {/* ==================== LEFT BRANDING PANEL ==================== */}
      <div className="hidden lg:flex lg:w-[520px] flex-col items-center justify-center text-[var(--sidebar-foreground)] relative overflow-hidden bg-[var(--sidebar)]">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 animated-mesh" />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern-overlay" />

        {/* Floating decorative elements */}
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />
        <div className="floating-ring floating-ring-1" />
        <div className="floating-ring floating-ring-2" />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-6 px-12"
          variants={leftPanelVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo with glowing ring */}
          <motion.div variants={slideFromLeft} className="relative">
            <div className="logo-glow-ring absolute -inset-3 rounded-[1.75rem]" />
            <div className="relative w-20 h-20 rounded-2xl bg-[var(--sidebar-accent)] flex items-center justify-center shadow-xl shadow-black/30">
              <Phone className="w-10 h-10 text-[var(--sidebar-primary)]" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={slideFromLeft}
            className="text-3xl font-bold tracking-tight text-center"
          >
            手机号数据分发系统
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={slideFromLeft}
            className="text-[var(--sidebar-foreground)]/70 text-center text-base leading-relaxed max-w-xs"
          >
            高效管理手机号数据，智能分发与跟进追踪，助力团队协作与数据治理
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            variants={slideFromLeft}
            className="mt-8 flex flex-col gap-4 w-full max-w-xs"
          >
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <f.icon className="w-4 h-4 text-[var(--sidebar-primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--sidebar-foreground)]">{f.title}</p>
                  <p className="text-xs text-[var(--sidebar-foreground)]/50 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ==================== RIGHT FORM PANEL ==================== */}
      <div className="flex-1 flex items-center justify-center bg-[var(--background)] p-6 pt-20 lg:pt-6 relative overflow-hidden">
        {/* Subtle background dot pattern */}
        <div className="absolute inset-0 form-bg-dots" />

        <motion.div
          className="relative z-10 w-full max-w-md"
          variants={rightPanelVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="flex flex-col gap-8">
                {/* Heading */}
                <motion.div variants={slideUp} className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-foreground">欢迎登录</h2>
                  <p className="text-muted-foreground text-sm">请输入您的账号和密码</p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Username */}
                  <motion.div variants={slideUp} className="flex flex-col gap-2">
                    <Label htmlFor="username" className="text-sm font-medium">用户名</Label>
                    <Input
                      id="username"
                      placeholder="请输入用户名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={slideUp} className="flex flex-col gap-2">
                    <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="h-11 pr-11 transition-all duration-200 focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {showPassword ? (
                            <motion.span
                              key="eyeoff"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <EyeOff className="w-4 h-4" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="eye"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Eye className="w-4 h-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </motion.div>

                  {/* Remember me */}
                  <motion.div variants={slideUp} className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(v) => setRememberMe(v === true)}
                      className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                      记住我
                    </Label>
                  </motion.div>

                  {/* Submit button */}
                  <motion.div variants={slideUp}>
                    <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        type="submit"
                        className="h-11 w-full mt-2 login-submit-btn relative overflow-hidden"
                        disabled={loading}
                      >
                        <span className="login-btn-shine" />
                        {loading && (
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        )}
                        {loading ? '登录中...' : '登 录'}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.p
            variants={slideUp}
            className="text-center text-xs text-muted-foreground/50 mt-10"
          >
            © 2026 手机号数据分发系统
          </motion.p>
        </motion.div>
      </div>

      {/* ==================== INJECTED STYLES ==================== */}
      <style>{`
        /* ── Animated gradient mesh (left panel) ── */
        .animated-mesh {
          background:
            radial-gradient(ellipse 600px 600px at 20% 30%, rgba(99, 102, 241, 0.18) 0%, transparent 70%),
            radial-gradient(ellipse 500px 500px at 80% 70%, rgba(139, 92, 246, 0.14) 0%, transparent 70%),
            radial-gradient(ellipse 400px 400px at 60% 20%, rgba(67, 56, 202, 0.12) 0%, transparent 70%);
          animation: mesh-drift 12s ease-in-out infinite alternate;
        }
        @keyframes mesh-drift {
          0%   { background-position: 0% 0%, 100% 100%, 50% 0%; }
          50%  { background-position: 30% 20%, 70% 80%, 80% 30%; }
          100% { background-position: 10% 40%, 90% 60%, 40% 60%; }
        }

        /* ── Dot pattern overlay (left panel) ── */
        .dot-pattern-overlay {
          background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* ── Floating orbs ── */
        .floating-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .floating-orb-1 {
          width: 200px; height: 200px;
          top: 10%; left: -40px;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.08) 0%, transparent 70%);
          animation: float-1 8s ease-in-out infinite;
        }
        .floating-orb-2 {
          width: 160px; height: 160px;
          bottom: 15%; right: -30px;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.07) 0%, transparent 70%);
          animation: float-2 10s ease-in-out infinite;
        }
        .floating-orb-3 {
          width: 100px; height: 100px;
          top: 55%; left: 60%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
          animation: float-3 7s ease-in-out infinite;
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(15px) scale(1.08); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.1); }
        }

        /* ── Floating rings ── */
        .floating-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.06);
          pointer-events: none;
        }
        .floating-ring-1 {
          width: 300px; height: 300px;
          top: -60px; right: -60px;
          animation: ring-rotate 30s linear infinite;
        }
        .floating-ring-2 {
          width: 220px; height: 220px;
          bottom: -40px; left: -40px;
          animation: ring-rotate 25s linear infinite reverse;
        }
        @keyframes ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Logo glow ring ── */
        .logo-glow-ring {
          background: conic-gradient(
            from 0deg,
            rgba(129, 140, 248, 0.3),
            rgba(167, 139, 250, 0.15),
            rgba(99, 102, 241, 0.05),
            rgba(167, 139, 250, 0.15),
            rgba(129, 140, 248, 0.3)
          );
          filter: blur(12px);
          animation: glow-pulse 3s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        /* ── Form background dots (right panel) ── */
        .form-bg-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* ── Submit button gradient & shine ── */
        .login-submit-btn {
          background: linear-gradient(135deg, var(--primary), oklch(0.45 0.18 270));
          transition: box-shadow 0.3s ease, background 0.3s ease;
        }
        .login-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, oklch(0.45 0.18 270), var(--primary));
          box-shadow: 0 8px 25px -5px rgba(79, 70, 229, 0.4);
        }
        .login-btn-shine {
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: skewX(-20deg);
          pointer-events: none;
        }
        .login-submit-btn:hover .login-btn-shine {
          animation: shine-slide 0.8s ease forwards;
        }
        @keyframes shine-slide {
          0%   { left: -100%; }
          100% { left: 150%; }
        }
      `}</style>
    </div>
  )
}