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

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 20
    const operType = searchParams.get('operType') || ''
    const keyword = searchParams.get('keyword') || ''
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (operType) {
      where.operType = operType
    }
    if (keyword) {
      where.OR = [
        { operContent: { contains: keyword } },
        { userNickname: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      db.sysLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { operTime: 'desc' },
      }),
      db.sysLog.count({ where }),
    ])

    return NextResponse.json({ code: 0, message: 'success', data: { list, total, page, pageSize } })
  } catch {
    return NextResponse.json({ code: 1, message: '获取日志列表失败' })
  }
}
