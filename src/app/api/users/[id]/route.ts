import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { createLog } from '@/lib/log-helper'

export async function PUT(
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
    const { nickname, role } = await request.json()

    const data: Record<string, string> = {}
    if (nickname !== undefined) data.nickname = nickname
    if (role !== undefined) data.role = role

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ code: 1, message: '没有要更新的字段' })
    }

    const user = await db.sysUser.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, nickname: true, role: true, status: true },
    })

    await createLog(payload.userId, payload.nickname, 'update_user', `更新用户 ${user.username} 的信息`)

    return NextResponse.json({ code: 0, message: 'success', data: user })
  } catch {
    return NextResponse.json({ code: 1, message: '更新用户失败' })
  }
}

export async function DELETE(
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

    if (userId === payload.userId) {
      return NextResponse.json({ code: 1, message: '不能删除自己' })
    }

    const user = await db.sysUser.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ code: 1, message: '用户不存在' })
    }

    const adminCount = await db.sysUser.count({ where: { role: 'admin', status: 1 } })
    if (user.role === 'admin' && adminCount <= 1) {
      return NextResponse.json({ code: 1, message: '不能删除最后一个管理员' })
    }

    await db.sysUser.delete({ where: { id: userId } })

    await createLog(payload.userId, payload.nickname, 'delete_user', `删除用户 ${user.username}`)

    return NextResponse.json({ code: 0, message: 'success' })
  } catch {
    return NextResponse.json({ code: 1, message: '删除用户失败' })
  }
}
