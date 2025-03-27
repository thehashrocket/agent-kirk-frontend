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