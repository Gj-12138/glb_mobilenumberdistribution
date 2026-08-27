import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { createLog } from '@/lib/log-helper'

export async function POST(request: Request) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      return NextResponse.json({ code: 1, message: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ code: 1, message: '无权限' }, { status: 401 })
    }

    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ code: 1, message: '参数错误' })
    }

    const count = await db.phoneData.deleteMany({
      where: { id: { in: ids } },
    })

    await createLog(payload.userId, payload.nickname, 'delete_data', `批量删除 ${count.count} 条数据`)

    return NextResponse.json({ code: 0, message: 'success', data: { count: count.count } })
  } catch {
    return NextResponse.json({ code: 1, message: '批量删除失败' })
  }
}
