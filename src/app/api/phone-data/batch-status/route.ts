import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { createLog } from '@/lib/log-helper'

export async function PATCH(request: Request) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      return NextResponse.json({ code: 1, message: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ code: 1, message: '登录已过期' }, { status: 401 })
    }

    const { ids, status } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ code: 1, message: '参数错误' })
    }

    // If user role, only allow updating own assigned data
    if (payload.role !== 'admin') {
      const records = await db.phoneData.findMany({
        where: { id: { in: ids } },
        select: { id: true, assignedTo: true },
      })
      const ownIds = records.filter(r => r.assignedTo === payload.userId).map(r => r.id)
      if (ownIds.length === 0) {
        return NextResponse.json({ code: 1, message: '无权限操作此数据' })
      }
      await db.phoneData.updateMany({
        where: { id: { in: ownIds } },
        data: { status, followedUpAt: new Date() },
      })
      await createLog(payload.userId, payload.nickname, 'status_change', `批量更新 ${ownIds.length} 条数据的状态为 ${status}`)
      return NextResponse.json({ code: 0, message: 'success', data: { count: ownIds.length } })
    }

    // Admin can update any
    await db.phoneData.updateMany({
      where: { id: { in: ids } },
      data: { status, followedUpAt: new Date() },
    })

    await createLog(payload.userId, payload.nickname, 'status_change', `批量更新 ${ids.length} 条数据的状态为 ${status}`)

    return NextResponse.json({ code: 0, message: 'success', data: { count: ids.length } })
  } catch {
    return NextResponse.json({ code: 1, message: '批量更新状态失败' })
  }
}
