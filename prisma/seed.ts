const { PrismaClient, Message, NotificationType } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

// Add type definitions
interface ThreadMessage {
  content: string;
  senderId: string;
  recipientId: string;
  isThreadStart?: boolean;
}

interface Thread {
  id: string;
  subject: string;
  messages: ThreadMessage[];
}

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
  const threads = [
    {
      id: 'thread1',
      subject: 'Analytics Help',
      messages: [
        {
          content: "Hello, I need help with my analytics",
          senderId: client1.id,
          recipientId: accountRep1.id,
          isThreadStart: true,
        },
        {
          content: "I'll help you with that. What specific information do you need?",
          senderId: accountRep1.id,
          recipientId: client1.id,
        },
        {
          content: "I'm looking at my bounce rate and it seems unusually high",
          senderId: client1.id,
          recipientId: accountRep1.id,
        }
      ]
    },
    {
      id: 'thread2',
      subject: 'Monthly Report Review',
      messages: [
        {
          content: "Here's your monthly performance report",
          senderId: accountRep1.id,
          recipientId: client2.id,
          isThreadStart: true,
        },
        {
          content: "Thanks! The numbers look great. Could you explain the conversion funnel in more detail?",
          senderId: client2.id,
          recipientId: accountRep1.id,
        }
      ]
    },
    {
      id: 'thread3',
      subject: 'Campaign Strategy',
      messages: [
        {
          content: "Can we discuss our Q2 campaign strategy?",
          senderId: client3.id,
          recipientId: accountRep2.id,
          isThreadStart: true,
        },
        {
          content: "Of course! I've been analyzing your Q1 results and have some suggestions",
          senderId: accountRep2.id,
          recipientId: client3.id,
        },
        {
          content: "Great! When can we schedule a call to go over them?",
          senderId: client3.id,
          recipientId: accountRep2.id,
        }
      ]
    }
  ];

  // Create messages for each thread
  for (const thread of threads) {
    let parentId: string | null = null;
    for (const msg of thread.messages) {
      const message: typeof Message = await prisma.message.create({
        data: {
          ...msg,
          threadId: thread.id,
          subject: msg.isThreadStart ? thread.subject : undefined,
          parentId
        }
      });
      if (parentId === null) {
        parentId = message.id;
      }
    }
  }

  // Create client satisfaction ratings
  const satisfactionData = [
    {
      userId: client1.id,
      accountRepId: accountRep1.id,
      ratings: [
        { rating: 4.5, feedback: "Very helpful with analytics explanations" },
        { rating: 5.0, feedback: "Quick responses and great insights" }
      ]
    },
    {
      userId: client2.id,
      accountRepId: accountRep1.id,
      ratings: [
        { rating: 4.0, feedback: "Good monthly reports, but could use more detail" },
        { rating: 4.5, feedback: "Improved communication and responsiveness" }
      ]
    },
    {
      userId: client3.id,
      accountRepId: accountRep2.id,
      ratings: [
        { rating: 5.0, feedback: "Excellent strategic planning and communication" },
        { rating: 4.8, feedback: "Very proactive with campaign suggestions" }
      ]
    }
  ];

  // Create satisfaction ratings
  for (const data of satisfactionData) {
    for (const rating of data.ratings) {
      await prisma.clientSatisfaction.create({
        data: {
          userId: data.userId,
          accountRepId: data.accountRepId,
          rating: rating.rating,
          feedback: rating.feedback
        }
      });
    }
  }

  // Create queries for clients
  const queryData = [
    {
      userId: client1.id,
      queries: [
        {
          prompt: "What were my top performing pages last month?",
          response: "Based on your GA4 data, your top performing pages were:\n1. /products (45k visits)\n2. /blog/seo-tips (32k visits)\n3. /services (28k visits)",
          accountGA4: "123456789",
          propertyGA4: "987654321",
          conversationID: "conv1"
        },
        {
          prompt: "What's my average session duration?",
          response: "Your average session duration for the past 30 days is 3:45 minutes, which is a 12% improvement from the previous period.",
          accountGA4: "123456789",
          propertyGA4: "987654321",
          conversationID: "conv1"
        }
      ]
    },
    {
      userId: client2.id,
      queries: [
        {
          prompt: "Show me my conversion trends",
          response: "Your conversion rate has increased from 2.3% to 2.8% over the past month. Key improvements seen in:\n- Newsletter signups (+15%)\n- Product demo requests (+22%)",
          accountGA4: "123456789",
          propertyGA4: "987654321",
          conversationID: "conv2"
        },
        {
          prompt: "What's my bounce rate by device type?",
          response: "Here's your bounce rate breakdown:\n- Desktop: 42%\n- Mobile: 55%\n- Tablet: 48%",
          accountGA4: "123456789",
          propertyGA4: "987654321",
          conversationID: "conv2"
        }
      ]
    },
    {
      userId: client3.id,
      queries: [
        {
          prompt: "Analyze my social media traffic sources",
          response: "Your top social traffic sources are:\n1. LinkedIn (45%)\n2. Twitter (30%)\n3. Facebook (15%)\n4. Instagram (10%)",
          accountGA4: "123456789",
          propertyGA4: "987654321",
          conversationID: "conv3"
        },
        {
          prompt: "What are my top converting channels?",
          response: "Your top converting channels are:\n1. Direct (4.2% conv. rate)\n2. Organic Search (3.8%)\n3. Email (3.5%)\n4. Paid Search (2.9%)",
          accountGA4: "123456789",
          propertyGA4: "987654321",
          conversationID: "conv3"
        }
      ]
    }
  ];

  // Create queries
  for (const data of queryData) {
    for (const query of data.queries) {
      await prisma.query.create({
        data: {
          userId: data.userId,
          ...query,
          dateToday: new Date()
        }
      });
    }
  }

  // Create notifications for new messages
  await prisma.notification.create({
    data: {
      userId: accountRep1.id,
      type: NotificationType.MESSAGE_RECEIVED,
      title: "New Message",
      content: "You have a new message from Client One",
      link: `/messages/thread1`
    }
  });

  await prisma.notification.create({
    data: {
      userId: accountRep2.id,
      type: NotificationType.MESSAGE_RECEIVED,
      title: "New Message",
      content: "You have a new message from Client Three",
      link: `/messages/thread3`
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