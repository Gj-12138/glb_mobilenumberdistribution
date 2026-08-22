import { db } from '@/lib/db'

export async function createLog(userId: number, nickname: string, type: string, content: string) {
  await db.sysLog.create({
    data: {
      userId,
      userNickname: nickname,
      operType: type,
      operContent: content,
    },
  })
}
