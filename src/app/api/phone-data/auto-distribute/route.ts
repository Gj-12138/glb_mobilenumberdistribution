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

    // Get all pending (unassigned) data
    const pendingData = await db.phoneData.findMany({
      where: { assignedTo: null, status: 'pending' },
      select: { id: true },
    })

    if (pendingData.length === 0) {
      return NextResponse.json({ code: 0, message: 'success', data: { count: 0 } })
    }

    // Get all active user-role users
    const users = await db.sysUser.findMany({
      where: { role: 'user', status: 1 },
      select: { id: true, nickname: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ code: 1, message: '没有可分配的用户' })
    }

    const now = new Date()
    let count = 0

    // Distribute evenly
    for (let i = 0; i < pendingData.length; i++) {
      const user = users[i % users.length]
      await db.phoneData.update({
        where: { id: pendingData[i].id },
        data: { assignedTo: user.id, assignedAt: now },
      })
      count++
    }

    await createLog(
      payload.userId,
      payload.nickname,
      'auto_distribute',
      `自动分配 ${count} 条数据给 ${users.length} 个用户`
    )

    return NextResponse.json({ code: 0, message: 'success', data: { count } })
  } catch {
    return NextResponse.json({ code: 1, message: '自动分配失败' })
  }
}
