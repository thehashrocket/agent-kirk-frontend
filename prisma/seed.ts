const { PrismaClient, Message, NotificationType } = require('@prisma/client');
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

  // Create admin users
  const admin1 = await prisma.user.upsert({
    where: { email: 'jason.shultz@1905newmedia.com' },
    update: {},
    create: {
      email: 'jason.shultz@1905newmedia.com',
      name: 'Jason Shultz',
      roleId: adminRole.id,
      settings: {
        create: {
          emailNotifications: true,
          theme: 'light'
        }
      }
    }
  });

  // Create account representatives
  const accountRep1 = await prisma.user.upsert({
    where: { email: 'jasshultz@gmail.com' },
    update: {},
    create: {
      email: 'jasshultz@gmail.com',
      name: 'Jason Shultz',
      roleId: accountRepRole.id,
      settings: {
        create: {
          emailNotifications: true,
          theme: 'light'
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
      roleId: clientRole.id,
      accountRepId: accountRep1.id,
      settings: {
        create: {
          emailNotifications: true,
          theme: 'light'
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
      roleId: clientRole.id,
      accountRepId: accountRep1.id,
      settings: {
        create: {
          emailNotifications: true,
          theme: 'light'
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
      roleId: clientRole.id,
      accountRepId: accountRep1.id,
      settings: {
        create: {
          emailNotifications: true,
          theme: 'light'
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
          recipientId: accountRep1.id
        },
        {
          content: "I'll help you with that. What specific information do you need?",
          senderId: accountRep1.id,
          recipientId: client1.id
        },
        {
          content: "I'm looking at my bounce rate and it seems unusually high",
          senderId: client1.id,
          recipientId: accountRep1.id
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
          recipientId: client2.id
        },
        {
          content: "Thanks! The numbers look great. Could you explain the conversion funnel in more detail?",
          senderId: client2.id,
          recipientId: accountRep1.id
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
          recipientId: accountRep1.id,
          isThreadStart: true,
        },
        {
          content: "Of course! I've been analyzing your Q1 results and have some suggestions",
          senderId: accountRep1.id,
          recipientId: client3.id,
        },
        {
          content: "Great! When can we schedule a call to go over them?",
          senderId: client3.id,
          recipientId: accountRep1.id,
        }
      ]
    }
  ];

  // Create messages for each thread
  for (const thread of threads) {
    let firstMessage = true;
    for (const msg of thread.messages) {
      await prisma.message.create({
        data: {
          content: msg.content,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          threadId: thread.id,
          isThreadStart: firstMessage
        }
      });
      firstMessage = false;
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
      accountRepId: accountRep1.id,
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
          content: "What were my top performing pages last month?",
          response: "Based on your GA4 data, your top performing pages were:\n1. /products (45k visits)\n2. /blog/seo-tips (32k visits)\n3. /services (28k visits)"
        },
        {
          content: "What's my average session duration?",
          response: "Your average session duration for the past 30 days is 3:45 minutes, which is a 12% improvement from the previous period."
        }
      ]
    },
    {
      userId: client2.id,
      queries: [
        {
          content: "Show me my conversion trends",
          response: "Your conversion rate has increased from 2.3% to 2.8% over the past month. Key improvements seen in:\n- Newsletter signups (+15%)\n- Product demo requests (+22%)"
        },
        {
          content: "What's my bounce rate by device type?",
          response: "Here's your bounce rate breakdown:\n- Desktop: 42%\n- Mobile: 55%\n- Tablet: 48%"
        }
      ]
    },
    {
      userId: client3.id,
      queries: [
        {
          content: "Analyze my social media traffic sources",
          response: "Your top social traffic sources are:\n1. LinkedIn (45%)\n2. Twitter (30%)\n3. Facebook (15%)\n4. Instagram (10%)"
        },
        {
          content: "What are my top converting channels?",
          response: "Your top converting channels are:\n1. Direct (4.2% conv. rate)\n2. Organic Search (3.8%)\n3. Email (3.5%)\n4. Paid Search (2.9%)"
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
          content: query.content,
          response: query.response,
          status: 'COMPLETED'
        }
      });
    }
  }

  // Create notifications for new messages
  await prisma.notification.create({
    data: {
      userId: accountRep1.id,
      type: NotificationType.MESSAGE,
      title: "New Message",
      content: "You have a new message from Client One"
    }
  });

  await prisma.notification.create({
    data: {
      userId: accountRep1.id,
      type: NotificationType.MESSAGE,
      title: "New Message",
      content: "You have a new message from Client Three"
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