import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { compareSync } from 'bcryptjs'
import { createLog } from '@/lib/log-helper'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ code: 1, message: '用户名和密码不能为空' })
    }

    const user = await db.sysUser.findUnique({ where: { username } })

    if (!user) {
      return NextResponse.json({ code: 1, message: '用户名或密码错误' })
    }

    if (!compareSync(password, user.password)) {
      return NextResponse.json({ code: 1, message: '用户名或密码错误' })
    }

    if (user.status !== 1) {
      return NextResponse.json({ code: 1, message: '账号已被禁用' })
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      nickname: user.nickname,
    })

    await createLog(user.id, user.nickname, 'login', `用户 ${user.username} 登录系统`)

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
      },
    })
  } catch {
    return NextResponse.json({ code: 1, message: '登录失败' })
  }
}
