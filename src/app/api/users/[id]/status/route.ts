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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ code: 1, message: '无权限' }, { status: 401 })
    }

    const { id } = await params
    const userId = Number(id)

    const user = await db.sysUser.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ code: 1, message: '用户不存在' })
    }

    const newStatus = user.status === 1 ? 0 : 1

    const updated = await db.sysUser.update({
      where: { id: userId },
      data: { status: newStatus },
      select: { id: true, username: true, nickname: true, role: true, status: true },
    })

    await createLog(payload.userId, payload.nickname, 'toggle_user_status', `${newStatus === 1 ? '启用' : '禁用'}用户 ${user.username}`)

    return NextResponse.json({ code: 0, message: 'success', data: updated })
  } catch {
    return NextResponse.json({ code: 1, message: '切换用户状态失败' })
  }
}
