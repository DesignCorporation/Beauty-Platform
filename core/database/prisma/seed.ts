// Beauty Platform Seed Data
// Создание тестовых данных для разработки

import { PrismaClient, UserRole, EntityStatus, Language, Currency, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Beauty Platform database...')

  // Очистка существующих данных
  await prisma.auditLog.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.client.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  // 1. Создание тестового салона (Tenant)
  const salon = await prisma.tenant.create({
    data: {
      slug: 'beauty-test-salon',
      name: 'Beauty Test Salon',
      description: 'Тестовый салон красоты для разработки',
      email: 'info@beauty-test-salon.ru',
      phone: '+7 (495) 123-45-67',
      country: 'Россия',
      city: 'Москва',
      address: 'ул. Тестовая, д. 1',
      postalCode: '123456',
      currency: Currency.RUB,
      language: Language.RU,
      timezone: 'Europe/Moscow',
      status: EntityStatus.ACTIVE,
      isActive: true
    }
  })

  console.log(`✅ Created salon: ${salon.name}`)

  // 2. Создание Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@beauty-platform.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Супер',
      lastName: 'Администратор',
      role: UserRole.SUPER_ADMIN,
      status: EntityStatus.ACTIVE,
      emailVerified: true,
      isActive: true
    }
  })

  console.log(`✅ Created Super Admin: ${superAdmin.email}`)

  // 3. Создание владельца салона
  const salonOwner = await prisma.user.create({
    data: {
      tenantId: salon.id,
      email: 'owner@beauty-test-salon.ru',
      password: await bcrypt.hash('owner123', 10),
      firstName: 'Анна',
      lastName: 'Владелец',
      phone: '+7 (495) 123-45-67',
      role: UserRole.SALON_OWNER,
      status: EntityStatus.ACTIVE,
      emailVerified: true,
      isActive: true
    }
  })

  console.log(`✅ Created Salon Owner: ${salonOwner.email}`)

  // 4. Создание мастеров
  const staff = [
    {
      email: 'master1@beauty-test-salon.ru',
      firstName: 'Мария',
      lastName: 'Иванова',
      color: '#ff6b6b',
      role: UserRole.STAFF_MEMBER
    },
    {
      email: 'master2@beauty-test-salon.ru',
      firstName: 'Елена',
      lastName: 'Петрова', 
      color: '#4ecdc4',
      role: UserRole.STAFF_MEMBER
    },
    {
      email: 'manager@beauty-test-salon.ru',
      firstName: 'Ольга',
      lastName: 'Менеджер',
      color: '#45b7d1',
      role: UserRole.MANAGER
    },
    {
      email: 'reception@beauty-test-salon.ru',
      firstName: 'Светлана',
      lastName: 'Администратор',
      color: '#f9ca24',
      role: UserRole.RECEPTIONIST
    }
  ]

  const createdStaff = []
  for (const member of staff) {
    const staffMember = await prisma.user.create({
      data: {
        tenantId: salon.id,
        email: member.email,
        password: await bcrypt.hash('staff123', 10),
        firstName: member.firstName,
        lastName: member.lastName,
        color: member.color,
        role: member.role,
        status: EntityStatus.ACTIVE,
        emailVerified: true,
        isActive: true
      }
    })
    createdStaff.push(staffMember)
    console.log(`✅ Created ${member.role}: ${staffMember.email}`)
  }

  // 5. Создание клиентов
  const clients = [
    { name: 'Анна Клиентова', email: 'anna@example.com', phone: '+7 (915) 123-11-11' },
    { name: 'Мария Покупатель', email: 'maria@example.com', phone: '+7 (915) 123-22-22' },
    { name: 'Елена Красотка', email: 'elena@example.com', phone: '+7 (915) 123-33-33' },
    { name: 'Ольга Стильная', email: 'olga@example.com', phone: '+7 (915) 123-44-44' },
    { name: 'Светлана Модная', email: 'svetlana@example.com', phone: '+7 (915) 123-55-55' }
  ]

  const createdClients = []
  for (const client of clients) {
    const createdClient = await prisma.client.create({
      data: {
        tenantId: salon.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: EntityStatus.ACTIVE
      }
    })
    createdClients.push(createdClient)
  }

  console.log(`✅ Created ${createdClients.length} clients`)

  // 6. Создание услуг
  const services = [
    { name: 'Стрижка женская', description: 'Модельная стрижка волос', duration: 60, price: 2500 },
    { name: 'Окрашивание', description: 'Полное окрашивание волос', duration: 120, price: 5000 },
    { name: 'Укладка', description: 'Праздничная укладка', duration: 45, price: 1500 },
    { name: 'Маникюр', description: 'Классический маникюр', duration: 90, price: 1800 },
    { name: 'Педикюр', description: 'Лечебный педикюр', duration: 120, price: 2200 },
    { name: 'Массаж лица', description: 'Расслабляющий массаж лица', duration: 60, price: 3000 }
  ]

  const createdServices = []
  for (const service of services) {
    const createdService = await prisma.service.create({
      data: {
        tenantId: salon.id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        status: EntityStatus.ACTIVE
      }
    })
    createdServices.push(createdService)
  }

  console.log(`✅ Created ${createdServices.length} services`)

  // 7. Создание записей на ближайшие дни
  const today = new Date()
  const appointments = []

  for (let day = 0; day < 7; day++) {
    const appointmentDate = new Date(today)
    appointmentDate.setDate(today.getDate() + day)
    appointmentDate.setHours(10, 0, 0, 0) // Начинаем с 10:00

    for (let hour = 0; hour < 6; hour++) {
      const startTime = new Date(appointmentDate)
      startTime.setHours(10 + hour * 2) // Каждые 2 часа

      const service = createdServices[Math.floor(Math.random() * createdServices.length)]
      const client = createdClients[Math.floor(Math.random() * createdClients.length)]
      const staffMember = createdStaff[Math.floor(Math.random() * 2)] // Только мастера

      const endTime = new Date(startTime)
      endTime.setMinutes(startTime.getMinutes() + service.duration)

      appointments.push({
        appointmentNumber: `BP-${Date.now()}-${appointments.length + 1}`,
        tenantId: salon.id,
        date: appointmentDate,
        startTime,
        endTime,
        clientId: client.id,
        serviceId: service.id,
        assignedToId: staffMember.id,
        status: day === 0 ? AppointmentStatus.IN_PROGRESS : 
                day < 3 ? AppointmentStatus.CONFIRMED : 
                AppointmentStatus.PENDING,
        notes: `Тестовая запись ${appointments.length + 1}`,
        createdById: salonOwner.id
      })
    }
  }

  const createdAppointments = []
  for (const appointment of appointments) {
    const createdAppointment = await prisma.appointment.create({
      data: appointment
    })
    createdAppointments.push(createdAppointment)
  }

  console.log(`✅ Created ${createdAppointments.length} appointments`)

  // 8. Создание audit логов
  await prisma.auditLog.create({
    data: {
      tenantId: salon.id,
      action: 'CREATE',
      entityType: 'Tenant',
      entityId: salon.id,
      userId: superAdmin.id,
      userRole: UserRole.SUPER_ADMIN,
      newValues: { name: salon.name },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script'
    }
  })

  console.log('✅ Created audit logs')

  console.log(`
🎉 Seeding completed successfully!

📊 Created:
   • 1 salon (tenant): ${salon.name}
   • 1 Super Admin: admin@beauty-platform.com (password: admin123)
   • 1 Salon Owner: owner@beauty-test-salon.ru (password: owner123)
   • 4 Staff members (password: staff123):
     - master1@beauty-test-salon.ru (Мастер)
     - master2@beauty-test-salon.ru (Мастер)  
     - manager@beauty-test-salon.ru (Менеджер)
     - reception@beauty-test-salon.ru (Администратор)
   • ${createdClients.length} clients
   • ${createdServices.length} services
   • ${createdAppointments.length} appointments

🔑 Test Credentials:
   Super Admin: admin@beauty-platform.com / admin123
   Salon Owner: owner@beauty-test-salon.ru / owner123
   Staff: staff123 (for all staff members)

🏢 Tenant ID: ${salon.id}
   Slug: ${salon.slug}
`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })