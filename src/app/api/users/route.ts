import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { hashSync } from 'bcryptjs'
import { createLog } from '@/lib/log-helper'

export async function GET(request: Request) {
  try {
    const token = getTokenFromHeader(request)
    if (!token) {
      return NextResponse.json({ code: 1, message: '未登录' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ code: 1, message: '无权限' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 20
    const keyword = searchParams.get('keyword') || ''
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { nickname: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      db.sysUser.findMany({
        where,
        select: { id: true, username: true, nickname: true, role: true, status: true, passwordText: true, createdAt: true, updatedAt: true },
        skip,
        take: pageSize,
        orderBy: { id: 'asc' },
      }),
      db.sysUser.count({ where }),
    ])

    return NextResponse.json({ code: 0, message: 'success', data: { list, total, page, pageSize } })
  } catch {
    return NextResponse.json({ code: 1, message: '获取用户列表失败' })
  }
}

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

    const { username, password, nickname, role } = await request.json()

    if (!username || !password || !nickname) {
      return NextResponse.json({ code: 1, message: '用户名、密码和昵称不能为空' })
    }

    const existing = await db.sysUser.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ code: 1, message: '用户名已存在' })
    }

    const user = await db.sysUser.create({
      data: {
        username,
        password: hashSync(password, 10),
        passwordText: password,
        nickname,
        role: role || 'user',
      },
      select: { id: true, username: true, nickname: true, role: true, status: true, passwordText: true, createdAt: true },
    })

    await createLog(payload.userId, payload.nickname, 'create_user', `创建用户 ${username}`)

    return NextResponse.json({ code: 0, message: 'success', data: user })
  } catch {
    return NextResponse.json({ code: 1, message: '创建用户失败' })
  }
}
