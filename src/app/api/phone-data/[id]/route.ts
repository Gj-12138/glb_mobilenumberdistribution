import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTokenFromHeader, verifyToken } from '@/lib/jwt'
import { createLog } from '@/lib/log-helper'

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
    const dataId = Number(id)

    const record = await db.phoneData.findUnique({ where: { id: dataId } })
    if (!record) {
      return NextResponse.json({ code: 1, message: '数据不存在' })
    }

    await db.phoneData.delete({ where: { id: dataId } })

    await createLog(payload.userId, payload.nickname, 'delete_data', `删除号码 ${record.phone}`)

    return NextResponse.json({ code: 0, message: 'success' })
  } catch {
    return NextResponse.json({ code: 1, message: '删除数据失败' })
  }
}
