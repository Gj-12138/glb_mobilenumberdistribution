import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { Prisma } from '@prisma/client'

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

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''

    const where: Prisma.PhoneDataWhereInput = { assignedTo: payload.userId }
    if (keyword) {
      where.OR = [
        { phone: { contains: keyword } },
        { name: { contains: keyword } },
      ]
    }

    const [total, pending, connected, unreachable, noAnswer] = await Promise.all([
      db.phoneData.count({ where }),
      db.phoneData.count({ where: { ...where, status: 'pending' } }),
      db.phoneData.count({ where: { ...where, status: 'connected' } }),
      db.phoneData.count({ where: { ...where, status: 'unreachable' } }),
      db.phoneData.count({ where: { ...where, status: 'no_answer' } }),
    ])

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: { total, pending, connected, unreachable, noAnswer },
    })
  } catch {
    return NextResponse.json({ code: 1, message: '获取统计失败' })
  }
}
