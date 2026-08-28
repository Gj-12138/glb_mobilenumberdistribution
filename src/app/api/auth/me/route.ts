import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'

export async function GET(request: Request) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      return NextResponse.json({ code: 1, message: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ code: 1, message: '登录已过期' }, { status: 401 })
    }

    const user = await db.sysUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, nickname: true, role: true, status: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json({ code: 1, message: '用户不存在' }, { status: 401 })
    }

    return NextResponse.json({ code: 0, message: 'success', data: user })
  } catch {
    return NextResponse.json({ code: 1, message: '获取用户信息失败' })
  }
}
