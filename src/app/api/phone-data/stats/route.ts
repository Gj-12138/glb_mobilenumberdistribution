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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ code: 1, message: '无权限' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    const source = searchParams.get('source') || ''

    const where: Prisma.PhoneDataWhereInput = {}
    if (keyword) {
      where.OR = [
        { phone: { contains: keyword } },
        { name: { contains: keyword } },
      ]
    }
    if (source) {
      where.source = source
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
