const { PrismaClient, Prisma } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create roles if they don't exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const accountRepRole = await prisma.role.upsert({
    where: { name: 'ACCOUNT_REP' },
    update: {},
    create: { name: 'ACCOUNT_REP' },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { name: 'CLIENT' },
  });

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      roleId: adminRole.id,
    },
  });

  const accountRep = await prisma.user.upsert({
    where: { email: 'rep@example.com' },
    update: {},
    create: {
      email: 'rep@example.com',
      name: 'Account Representative',
      roleId: accountRepRole.id,
    },
  });

  const testClient = await prisma.user.upsert({
    where: { email: 'jasshultz@gmail.com' },
    update: {},
    create: {
      email: 'jasshultz@gmail.com',
      name: 'Jason Shultz',
      roleId: clientRole.id,
      accountRepId: accountRep.id,
    },
  });

  // Create additional test clients
  const testClients = [];
  for (let i = 1; i <= 5; i++) {
    const client = await prisma.user.upsert({
      where: { email: `client${i}@example.com` },
      update: {},
      create: {
        email: `client${i}@example.com`,
        name: `Test Client ${i}`,
        roleId: clientRole.id,
        accountRepId: accountRep.id,
      },
    });
    testClients.push(client);
  }

  // Create sample conversations for Jason Shultz
  const jasonConversations = [
    {
      title: 'Getting Started with Next.js',
      isStarred: true,
      queries: [
        {
          content: 'How do I create a new Next.js project?',
          response: 'To create a new Next.js project, use `pnpm create next-app@latest`. This will guide you through the setup process.',
          status: 'COMPLETED',
        },
        {
          content: 'What are the key features of Next.js 13?',
          response: 'Next.js 13 introduces several key features including the App Router, Server Components, and improved data fetching.',
          status: 'COMPLETED',
        },
      ],
    },
    {
      title: 'Tailwind CSS Setup',
      isStarred: false,
      queries: [
        {
          content: 'How do I integrate Tailwind CSS with Next.js?',
          response: 'You can integrate Tailwind CSS by installing the necessary dependencies and creating a tailwind.config.js file.',
          status: 'COMPLETED',
        },
      ],
    },
    {
      title: 'Database Integration',
      isStarred: true,
      queries: [
        {
          content: 'What are the best practices for using Prisma with Next.js?',
          response: 'When using Prisma with Next.js, it\'s recommended to create a singleton instance and use it across your application.',
          status: 'COMPLETED',
        },
        {
          content: 'How do I handle database migrations?',
          response: 'Use Prisma Migrate for database migrations. The main commands are `prisma migrate dev` and `prisma migrate deploy`.',
          status: 'COMPLETED',
        },
      ],
    },
  ];

  // Create Jason's conversations
  for (const convData of jasonConversations) {
    const conversation = await prisma.conversation.create({
      data: {
        title: convData.title,
        isStarred: convData.isStarred,
        userId: testClient.id,
        queries: {
          create: convData.queries.map(query => ({
            content: query.content,
            response: query.response,
            status: query.status,
            userId: testClient.id,
          })),
        },
      },
    });
  }

  // Create random conversations for other test clients
  const topics = [
    'API Integration',
    'Authentication Setup',
    'Performance Optimization',
    'Testing Strategies',
    'Deployment Configuration',
    'State Management',
    'UI Components',
    'Error Handling',
  ];

  const responses = [
    'Here\'s a detailed guide on how to implement this...',
    'The best practice approach would be to...',
    'You can solve this by following these steps...',
    'Let me explain the key concepts...',
    'Here\'s an example implementation...',
  ];

  // Generate random conversations for each test client
  for (const client of testClients) {
    const numConversations = Math.floor(Math.random() * 5) + 2; // 2-6 conversations per client
    
    for (let i = 0; i < numConversations; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const numQueries = Math.floor(Math.random() * 3) + 1; // 1-3 queries per conversation
      
      await prisma.conversation.create({
        data: {
          title: `${topic} Discussion`,
          isStarred: Math.random() > 0.7, // 30% chance of being starred
          userId: client.id,
          queries: {
            create: Array.from({ length: numQueries }, () => ({
              content: `Can you help me with ${topic.toLowerCase()}?`,
              response: responses[Math.floor(Math.random() * responses.length)],
              status: 'COMPLETED',
              userId: client.id,
            })),
          },
        },
      });
    }
  }

  // Create sample activities for the test client
  const activityTypes = [
    'login',
    'query',
    'settings_update',
    'export_data',
    'view_report',
  ] as const;

  const now = new Date();
  const activities = [];

  // Generate activities for the last 30 days
  for (let i = 0; i < 100; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const status = Math.random() > 0.1 ? 'SUCCESS' : 'ERROR';

    let description = '';
    let metadata = {};

    switch (type) {
      case 'login':
        description = 'User logged in to the system';
        metadata = { device: 'web', browser: 'Chrome' };
        break;
      case 'query':
        description = 'Executed a query';
        metadata = { queryType: 'analysis', duration: Math.random() * 5 };
        break;
      case 'settings_update':
        description = 'Updated user settings';
        metadata = { setting: 'notifications', value: 'enabled' };
        break;
      case 'export_data':
        description = 'Exported report data';
        metadata = { format: 'csv', rows: Math.floor(Math.random() * 1000) };
        break;
      case 'view_report':
        description = 'Viewed activity report';
        metadata = { reportType: 'monthly', period: 'last-30-days' };
        break;
      default:
        description = 'Unknown activity';
        metadata = {};
    }

    activities.push({
      type,
      description,
      status,
      metadata,
      createdAt: date,
      updatedAt: date,
      userId: testClient.id,
    });
  }

  // Insert all activities
  await prisma.clientActivity.createMany({
    data: activities,
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