import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { hashSync } from 'bcryptjs'
import { createLog } from '@/lib/log-helper'

export async function POST(
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

    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ code: 1, message: '新密码不能为空' })
    }

    const user = await db.sysUser.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ code: 1, message: '用户不存在' })
    }

    await db.sysUser.update({
      where: { id: userId },
      data: { password: hashSync(password, 10) },
    })

    await createLog(payload.userId, payload.nickname, 'reset_password', `重置用户 ${user.username} 的密码`)

    return NextResponse.json({ code: 0, message: 'success' })
  } catch {
    return NextResponse.json({ code: 1, message: '重置密码失败' })
  }
}
