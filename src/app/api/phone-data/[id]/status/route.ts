import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { createLog } from '@/lib/log-helper'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      return NextResponse.json({ code: 1, message: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ code: 1, message: '登录已过期' }, { status: 401 })
    }

    const { id } = await params
    const dataId = Number(id)
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ code: 1, message: '状态不能为空' })
    }

    // If user role, only allow updating own assigned data
    if (payload.role !== 'admin') {
      const record = await db.phoneData.findUnique({ where: { id: dataId } })
      if (!record || record.assignedTo !== payload.userId) {
        return NextResponse.json({ code: 1, message: '无权限操作此数据' })
      }
    }

    const updated = await db.phoneData.update({
      where: { id: dataId },
      data: {
        status,
        followedUpAt: new Date(),
      },
    })

    await createLog(payload.userId, payload.nickname, 'status_change', `更新号码 ${updated.phone} 的状态为 ${status}`)

    return NextResponse.json({ code: 0, message: 'success', data: updated })
  } catch {
    return NextResponse.json({ code: 1, message: '更新状态失败' })
  }
}
