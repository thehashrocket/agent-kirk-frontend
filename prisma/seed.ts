const { PrismaClient, NotificationType } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const accountRepRole = await prisma.role.upsert({
    where: { name: "ACCOUNT_REP" },
    update: {},
    create: { name: "ACCOUNT_REP" },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: "CLIENT" },
    update: {},
    create: { name: "CLIENT" },
  });

  // Create test password hash
  const hashedPassword = await hash('password123', 12);

  // Create admin users
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      roleId: adminRole.id,
      settings: {
        create: {
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        }
      }
    }
  });

  // Create account representatives
  const accountRep1 = await prisma.user.upsert({
    where: { email: 'rep1@example.com' },
    update: {},
    create: {
      email: 'rep1@example.com',
      name: 'Account Rep One',
      password: hashedPassword,
      roleId: accountRepRole.id,
      settings: {
        create: {
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        }
      }
    }
  });

  const accountRep2 = await prisma.user.upsert({
    where: { email: 'rep2@example.com' },
    update: {},
    create: {
      email: 'rep2@example.com',
      name: 'Account Rep Two',
      password: hashedPassword,
      roleId: accountRepRole.id,
      settings: {
        create: {
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        }
      }
    }
  });

  // Create clients
  const client1 = await prisma.user.upsert({
    where: { email: 'client1@example.com' },
    update: {},
    create: {
      email: 'client1@example.com',
      name: 'Client One',
      password: hashedPassword,
      roleId: clientRole.id,
      accountRepId: accountRep1.id,
      settings: {
        create: {
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        }
      }
    }
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'client2@example.com' },
    update: {},
    create: {
      email: 'client2@example.com',
      name: 'Client Two',
      password: hashedPassword,
      roleId: clientRole.id,
      accountRepId: accountRep1.id,
      settings: {
        create: {
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        }
      }
    }
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'client3@example.com' },
    update: {},
    create: {
      email: 'client3@example.com',
      name: 'Client Three',
      password: hashedPassword,
      roleId: clientRole.id,
      accountRepId: accountRep2.id,
      settings: {
        create: {
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        }
      }
    }
  });

  // Create message threads
  const thread1 = await prisma.message.create({
    data: {
      content: "Hello, I need help with my analytics",
      senderId: client1.id,
      recipientId: accountRep1.id,
      isThreadStart: true,
      threadId: 'thread1',
    }
  });

  await prisma.message.create({
    data: {
      content: "I'll help you with that. What specific information do you need?",
      senderId: accountRep1.id,
      recipientId: client1.id,
      threadId: 'thread1',
      parentId: thread1.id
    }
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: accountRep1.id,
      type: NotificationType.MESSAGE_RECEIVED,
      title: "New Message",
      content: "You have a new message from Client One",
      link: `/messages/${thread1.id}`
    }
  });

  // Create queries for clients
  await prisma.query.create({
    data: {
      userId: client1.id,
      prompt: "What were my top performing pages last month?",
      response: "Based on your GA4 data, your top performing pages were...",
      accountGA4: "123456789",
      propertyGA4: "987654321",
      conversationID: "conv1",
      dateToday: new Date(),
    }
  });

  await prisma.query.create({
    data: {
      userId: client2.id,
      prompt: "Show me my conversion trends",
      response: "Here are your conversion trends over the past 30 days...",
      accountGA4: "123456789",
      propertyGA4: "987654321",
      conversationID: "conv2",
      dateToday: new Date(),
    }
  });

  // Create message with attachment
  const messageWithAttachment = await prisma.message.create({
    data: {
      content: "Here's the report you requested",
      senderId: accountRep1.id,
      recipientId: client1.id,
      isThreadStart: true,
      threadId: 'thread2',
    }
  });

  await prisma.attachment.create({
    data: {
      filename: "analytics_report.pdf",
      fileSize: 1024 * 1024, // 1MB
      mimeType: "application/pdf",
      url: "https://example.com/files/analytics_report.pdf",
      messageId: messageWithAttachment.id
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 