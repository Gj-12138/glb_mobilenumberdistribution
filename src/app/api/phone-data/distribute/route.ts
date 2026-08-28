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

    const { ids, assignedTo } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0 || !assignedTo) {
      return NextResponse.json({ code: 1, message: '参数错误' })
    }

    const targetUser = await db.sysUser.findUnique({ where: { id: assignedTo } })
    if (!targetUser) {
      return NextResponse.json({ code: 1, message: '目标用户不存在' })
    }

    await db.phoneData.updateMany({
      where: { id: { in: ids } },
      data: {
        assignedTo,
        assignedAt: new Date(),
      },
    })

    await createLog(payload.userId, payload.nickname, 'distribute', `分配 ${ids.length} 条数据给 ${targetUser.nickname}`)

    return NextResponse.json({ code: 0, message: 'success', data: { count: ids.length } })
  } catch {
    return NextResponse.json({ code: 1, message: '分配失败' })
  }
}
