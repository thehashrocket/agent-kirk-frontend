const { PrismaClient } = require("@prisma/client");

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

  const userRole = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" },
  });

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      roleId: adminRole.id,
    },
  });

  console.log({ adminRole, accountRepRole, clientRole, userRole, adminUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 