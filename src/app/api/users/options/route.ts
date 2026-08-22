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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ code: 1, message: '无权限' }, { status: 401 })
    }

    const list = await db.sysUser.findMany({
      where: { status: 1 },
      select: { id: true, nickname: true },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({ code: 0, message: 'success', data: list })
  } catch {
    return NextResponse.json({ code: 1, message: '获取用户选项失败' })
  }
}
