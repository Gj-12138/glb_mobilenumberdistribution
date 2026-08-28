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

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 20
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = { assignedTo: payload.userId }
    if (keyword) {
      where.OR = [
        { phone: { contains: keyword } },
        { name: { contains: keyword } },
      ]
    }
    if (status) {
      where.status = status
    }

    const [list, total] = await Promise.all([
      db.phoneData.findMany({
        where,
        include: { assignedUser: { select: { id: true, nickname: true } } },
        skip,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      db.phoneData.count({ where }),
    ])

    return NextResponse.json({ code: 0, message: 'success', data: { list, total, page, pageSize } })
  } catch {
    return NextResponse.json({ code: 1, message: '获取我的数据列表失败' })
  }
}
