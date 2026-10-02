const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Adding developer account...');
  
  await prisma.user.upsert({
    where: { username: 'developer' },
    update: {
      password: '@3DevGada',
      role: 'Developer'
    },
    create: {
      name: 'Developer',
      username: 'developer',
      password: '@3DevGada',
      email: 'developer@example.com',
      role: 'Developer',
      status: 'Active'
    }
  });

  console.log('Developer account added successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
