import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.sysLog.deleteMany()
  await prisma.phoneData.deleteMany()
  await prisma.sysUser.deleteMany()

  // Create users
  const admin = await prisma.sysUser.create({
    data: {
      username: 'admin',
      password: hashSync('admin123', 10),
      nickname: '管理员',
      role: 'admin',
      status: 1,
    },
  })

  const user01 = await prisma.sysUser.create({
    data: {
      username: 'user01',
      password: hashSync('123456', 10),
      nickname: '张三',
      role: 'user',
      status: 1,
    },
  })

  const user02 = await prisma.sysUser.create({
    data: {
      username: 'user02',
      password: hashSync('123456', 10),
      nickname: '李四',
      role: 'user',
      status: 1,
    },
  })

  const user03 = await prisma.sysUser.create({
    data: {
      username: 'user03',
      password: hashSync('123456', 10),
      nickname: '王五',
      role: 'user',
      status: 1,
    },
  })

  // Create sample phone data
  const phones = [
    { phone: '13800138001', name: '赵六', status: 'pending' },
    { phone: '13800138002', name: '钱七', status: 'pending' },
    { phone: '13800138003', name: '孙八', status: 'no_answer' },
    { phone: '13800138004', name: '周九', status: 'pending' },
    { phone: '13800138005', name: '吴十', status: 'connected' },
    { phone: '13800138006', name: '郑十一', status: 'pending' },
    { phone: '13800138007', name: '王十二', status: 'unreachable' },
    { phone: '13800138008', name: '冯十三', status: 'pending' },
    { phone: '13800138009', name: '陈十四', status: 'pending' },
    { phone: '13800138010', name: '褚十五', status: 'pending' },
    { phone: '13800138011', name: '卫十六', status: 'no_answer' },
    { phone: '13800138012', name: '蒋十七', status: 'pending' },
    { phone: '13800138013', name: '沈十八', status: 'connected' },
    { phone: '13800138014', name: '韩十九', status: 'pending' },
    { phone: '13800138015', name: '杨二十', status: 'pending' },
    { phone: '13800138016', name: '朱廿一', status: 'unreachable' },
    { phone: '13800138017', name: '秦廿二', status: 'pending' },
    { phone: '13800138018', name: '尤廿三', status: 'pending' },
    { phone: '13800138019', name: '许廿四', status: 'pending' },
    { phone: '13800138020', name: '何廿五', status: 'pending' },
  ]

  for (const p of phones) {
    await prisma.phoneData.create({
      data: {
        phone: p.phone,
        name: p.name,
        status: p.status,
        assignedTo: ['no_answer', 'connected', 'unreachable'].includes(p.status) ? user01.id : null,
        assignedAt: ['no_answer', 'connected', 'unreachable'].includes(p.status) ? new Date() : null,
        createdBy: admin.id,
      },
    })
  }

  // Create some logs
  await prisma.sysLog.createMany({
    data: [
      { userId: admin.id, userNickname: admin.nickname, operType: 'login', operContent: '管理员登录系统' },
      { userId: admin.id, userNickname: admin.nickname, operType: 'import', operContent: '批量导入20条手机号数据' },
      { userId: user01.id, userNickname: user01.nickname, operType: 'login', operContent: '张三登录系统' },
      { userId: user01.id, userNickname: user01.nickname, operType: 'status_change', operContent: '更新手机号13800138005状态为已打通' },
    ],
  })

  console.log('Seed data created successfully!')
  console.log(`Users: admin/admin123, user01/123456, user02/123456, user03/123456`)
  console.log(`Phone data: 20 records`)
  console.log(`Logs: 4 records`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
