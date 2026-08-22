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

    const { phones, source } = await request.json()

    if (!Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json({ code: 1, message: '请提供手机号数据' })
    }

    // Deduplicate phones
    const uniquePhones = [...new Set(phones)]

    const created = await db.phoneData.createMany({
      data: uniquePhones.map((phone: string) => ({
        phone,
        source: source || null,
        status: 'pending',
        createdBy: payload.userId,
      })),
    })

    const sourceInfo = source ? `（来源：${source}）` : ''
    await createLog(payload.userId, payload.nickname, 'import', `导入 ${created.count} 条号码数据${sourceInfo}`)

    return NextResponse.json({ code: 0, message: 'success', data: { count: created.count } })
  } catch {
    return NextResponse.json({ code: 1, message: '导入失败' })
  }
}
