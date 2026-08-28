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

    // Get distinct non-null source values
    const results = await db.phoneData.findMany({
      where: { source: { not: null } },
      select: { source: true },
      distinct: ['source'],
      orderBy: { source: 'asc' },
    })

    const sources = results.map((r) => r.source).filter(Boolean) as string[]

    return NextResponse.json({ code: 0, message: 'success', data: sources })
  } catch {
    return NextResponse.json({ code: 1, message: '获取来源列表失败' })
  }
}
