import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { compareSync, hashSync } from 'bcryptjs'
import { createLog } from '@/lib/log-helper'

export async function POST(request: Request) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      return NextResponse.json({ code: 1, message: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ code: 1, message: '登录已过期' }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ code: 1, message: '旧密码和新密码不能为空' })
    }

    const user = await db.sysUser.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json({ code: 1, message: '用户不存在' })
    }

    if (!compareSync(oldPassword, user.password)) {
      return NextResponse.json({ code: 1, message: '旧密码错误' })
    }

    await db.sysUser.update({
      where: { id: payload.userId },
      data: { password: hashSync(newPassword, 10), passwordText: newPassword },
    })

    await createLog(payload.userId, payload.nickname, 'change_password', `用户 ${payload.username} 修改了密码`)

    return NextResponse.json({ code: 0, message: 'success' })
  } catch {
    return NextResponse.json({ code: 1, message: '修改密码失败' })
  }
}
