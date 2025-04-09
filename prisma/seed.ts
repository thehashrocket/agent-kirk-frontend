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
    where: { email: 'admin@1905newmedia.com' },
    update: {},
    create: {
      email: 'admin@1905newmedia.com',
      name: 'Admin User',
      roleId: adminRole.id,
    },
  });

  const accountRep = await prisma.user.upsert({
    where: { email: 'jasshultz@gmail.com' },
    update: {},
    create: {
      email: 'jasshultz@gmail.com',
      name: 'Jason Shultz',
      roleId: accountRepRole.id,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'jason.shultz@1905newmedia.com' },
    update: {},
    create: {
      email: 'jason.shultz@1905newmedia.com',
      name: 'Jason Shultz',
      roleId: clientRole.id,
      accountRepId: accountRep.id,
      image: `https://i.pravatar.cc/150?u=jason.shultz@1905newmedia.com`,
      isActive: true,
    },
  });

  // Create test clients for Jason
  const testClients = [];
  const clientNames = [
    { name: 'Sarah Johnson', email: 'sarah@techstartup.com' },
    { name: 'Michael Chen', email: 'michael@innovatedesign.co' },
    { name: 'Emma Davis', email: 'emma@webagency.net' },
    { name: 'Alex Rodriguez', email: 'alex@digitalmarketing.io' },
    { name: 'Lisa Thompson', email: 'lisa@ecommerce.store' }
  ];

  for (const { name, email } of clientNames) {
    const client = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        roleId: clientRole.id,
        accountRepId: accountRep.id,
        image: `https://i.pravatar.cc/150?u=${email}`,
        isActive: Math.random() > 0.1, // 90% chance of being active
      },
    });
    testClients.push(client);
  }

  // Create sample conversations for each client
  const conversationTemplates = [
    {
      title: 'Next.js App Performance',
      queries: [
        {
          content: 'How can I improve the performance of my Next.js application?',
          response: 'To improve Next.js performance, consider implementing:\n1. Image optimization with next/image\n2. Static Generation for applicable pages\n3. Code splitting and lazy loading\n4. Proper caching strategies\n5. Server-side rendering for dynamic content',
          rating: 1,
        },
        {
          content: 'What tools can I use to measure performance?',
          response: 'Here are some essential tools for measuring Next.js performance:\n1. Lighthouse for overall performance metrics\n2. Chrome DevTools Performance tab\n3. Next.js Analytics\n4. Web Vitals reporting\n5. Custom performance monitoring with tools like Sentry',
          rating: 1,
        },
        {
          content: 'My images are loading slowly even with next/image',
          response: 'This could be due to several factors:\n1. Check if you\'ve configured the proper sizes\n2. Verify your image optimization settings\n3. Consider using a CDN for image delivery',
          rating: -1, // User wasn't satisfied with the response
        }
      ]
    },
    {
      title: 'API Integration Strategy',
      queries: [
        {
          content: 'What\'s the best way to handle API authentication in my app?',
          response: 'For API authentication, consider these approaches:\n1. JWT tokens with secure storage\n2. HTTP-only cookies for better security\n3. Refresh token rotation\n4. Rate limiting and request validation\n5. Environment variable management for API keys',
          rating: 1,
        },
        {
          content: 'How do I implement refresh token rotation?',
          response: 'Here\'s a basic implementation of refresh token rotation:\n1. Store refresh token in HTTP-only cookie\n2. Create endpoint for token refresh\n3. Implement token blacklisting\n4. Add proper error handling',
          rating: -1, // Response wasn't detailed enough
        },
        {
          content: 'Can you show me a code example for JWT implementation?',
          response: 'Here\'s a basic example using jsonwebtoken:\n```typescript\nimport jwt from \'jsonwebtoken\';\n\nconst generateToken = (userId: string) => {\n  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: \'1h\' });\n};\n```',
          rating: 1,
        }
      ]
    },
    {
      title: 'Database Design Review',
      queries: [
        {
          content: 'Can you review my database schema for scalability?',
          response: 'Here are some recommendations for your schema:\n1. Proper indexing strategy\n2. Normalized structure to prevent redundancy\n3. Efficient relationship modeling\n4. Consideration for future growth\n5. Performance optimization tips',
          rating: 0,
        },
        {
          content: 'How can I optimize my PostgreSQL queries?',
          response: 'To optimize PostgreSQL queries:\n1. Use EXPLAIN ANALYZE\n2. Add appropriate indexes\n3. Optimize JOIN operations\n4. Consider materialized views\n5. Implement query caching',
          rating: 1,
        },
        {
          content: 'My queries are still slow after indexing',
          response: 'Let\'s check your current indexes and query patterns.',
          rating: -1, // Response was too vague
        }
      ]
    },
    {
      title: 'UI/UX Improvements',
      queries: [
        {
          content: 'How can I make my app more user-friendly?',
          response: 'To improve UI/UX:\n1. Implement consistent design patterns\n2. Add loading states and transitions\n3. Optimize for mobile responsiveness\n4. Improve accessibility\n5. Add helpful error messages and feedback',
          rating: 1,
        },
        {
          content: 'What\'s the best way to handle form validation?',
          response: 'For form validation, consider:\n1. Use react-hook-form\n2. Implement real-time validation\n3. Show clear error messages\n4. Add proper aria-labels\n5. Include success feedback',
          rating: 1,
        }
      ]
    },
    {
      title: 'Testing Strategy',
      queries: [
        {
          content: 'How should I structure my testing strategy?',
          response: 'A comprehensive testing strategy should include:\n1. Unit tests with Jest\n2. Integration tests with React Testing Library\n3. E2E tests with Cypress\n4. API contract testing\n5. Performance testing',
          rating: 1,
        },
        {
          content: 'Can you help debug my failing test?',
          response: 'Without seeing the specific test code, I can\'t provide detailed guidance.',
          rating: -1, // Response wasn't helpful
        },
        {
          content: 'How do I mock API calls in tests?',
          response: 'To mock API calls:\n1. Use MSW (Mock Service Worker)\n2. Set up test fixtures\n3. Implement proper error scenarios\n4. Test loading states',
          rating: 1,
        }
      ]
    },
    {
      title: 'State Management',
      queries: [
        {
          content: 'Should I use Redux or Context API?',
          response: 'The choice depends on your needs:\n1. Context API for simple state\n2. Redux for complex state with many updates\n3. Consider alternatives like Zustand\n4. Evaluate based on team experience',
          rating: 0, // Answer was somewhat helpful but not definitive
        },
        {
          content: 'How do I handle form state in a large application?',
          response: 'For form state management:\n1. Use Formik or react-hook-form\n2. Implement field-level validation\n3. Handle complex form logic\n4. Manage form submission state',
          rating: 1,
        },
        {
          content: 'My Redux actions are not updating the state',
          response: 'Check if you\'re following Redux principles:\n1. Actions must be plain objects\n2. Reducers should be pure functions\n3. State updates must be immutable',
          rating: -1, // Too generic advice
        }
      ]
    }
  ];

  // Create conversations for each client
  for (const client of testClients) {
    // Select 2-4 random conversation templates for each client
    const numConversations = Math.floor(Math.random() * 3) + 2;
    const shuffledTemplates = [...conversationTemplates].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffledTemplates.slice(0, numConversations);

    for (const template of selectedTemplates) {
      const conversation = await prisma.conversation.create({
        data: {
          title: template.title,
          isStarred: Math.random() > 0.7, // 30% chance of being starred
          userId: client.id,
          queries: {
            create: template.queries.map(query => ({
              content: query.content,
              response: query.response,
              status: 'COMPLETED',
              rating: query.rating,
              userId: client.id,
            })),
          },
        },
      });
    }

    // Create satisfaction ratings for each client
    const numRatings = Math.floor(Math.random() * 4) + 3; // 3-6 ratings per client
    const feedbackOptions = [
      'Excellent support and guidance!',
      'Very helpful in solving our technical challenges.',
      'Great communication and quick responses.',
      'Helped us improve our application significantly.',
      'Professional and knowledgeable assistance.'
    ];

    for (let i = 0; i < numRatings; i++) {
      const ratingDate = new Date();
      ratingDate.setDate(ratingDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
      
      await prisma.clientSatisfaction.create({
        data: {
          rating: 4.5 + (Math.random() * 0.5), // Random rating between 4.5 and 5
          feedback: Math.random() > 0.5 ? feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)] : undefined,
          createdAt: ratingDate,
          userId: client.id,
          accountRepId: accountRep.id,
        },
      });
    }

    // Create support tickets for each client
    const ticketTemplates = [
      {
        title: 'Unable to access dashboard',
        description: 'Getting a 403 error when trying to access the main dashboard. This is blocking our team from accessing critical metrics.'
      },
      {
        title: 'Performance issues with data visualization',
        description: 'Charts and graphs are loading very slowly, especially when viewing historical data. This is impacting our ability to make quick decisions.'
      },
      {
        title: 'Need help with API integration',
        description: 'We\'re trying to integrate your API with our internal systems but running into CORS issues. Need guidance on proper setup.'
      },
      {
        title: 'Export functionality not working',
        description: 'The CSV export feature is failing when trying to export more than 1000 rows. Need this fixed for our monthly reporting.'
      },
      {
        title: 'Custom dashboard setup assistance',
        description: 'Looking for help in setting up custom dashboards for different teams. Need guidance on best practices and configuration.'
      },
      {
        title: 'Data discrepancy in reports',
        description: 'Noticing some inconsistencies between the dashboard numbers and our internal tracking. Need help investigating the cause.'
      },
      {
        title: 'User permissions issue',
        description: 'New team members are not getting the correct role permissions when added to the system. Need help adjusting the permission settings.'
      },
      {
        title: 'Feature request: Additional metrics',
        description: 'Would like to request additional metrics for tracking user engagement. Specifically looking for session duration and bounce rate analytics.'
      }
    ];

    const numTickets = Math.floor(Math.random() * 3) + 3; // 3-5 tickets per client
    const selectedTickets = [...ticketTemplates]
      .sort(() => Math.random() - 0.5)
      .slice(0, numTickets);

    for (const template of selectedTickets) {
      const ticketDate = new Date();
      ticketDate.setDate(ticketDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

      const status = ['OPEN', 'IN_PROGRESS', 'RESOLVED'][Math.floor(Math.random() * 3)];
      const priority = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)];
      const isAssigned = Math.random() > 0.3; // 70% chance of being assigned

      await prisma.ticket.create({
        data: {
          title: template.title,
          description: template.description,
          status: status,
          priority: priority,
          createdAt: ticketDate,
          updatedAt: ticketDate,
          clientId: client.id,
          assignedToId: isAssigned ? accountRep.id : null,
        },
      });
    }
  }

  // Create sample activities for all clients
  const activityTypes = [
    'login',
    'query',
    'settings_update',
    'export_data',
    'view_report',
  ] as const;

  const now = new Date();
  const activities = [];

  // Generate activities for all clients
  const allClients = [...testClients];
  
  for (const client of allClients) {
    // Generate 20-50 activities per client
    const numActivities = Math.floor(Math.random() * 31) + 20;
    
    for (let i = 0; i < numActivities; i++) {
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
        userId: client.id,
      });
    }

    // Add some activities for today
    const todayActivities = Math.floor(Math.random() * 3) + 1; // 1-3 activities today
    for (let i = 0; i < todayActivities; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const status = Math.random() > 0.1 ? 'SUCCESS' : 'ERROR';

      activities.push({
        type,
        description: `Today's ${type} activity`,
        status,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: client.id,
      });
    }
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