import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Test connection by creating a tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant',
        casino: 'stake',
        apiConfig: { url: 'https://example.com/api/leaderboard.csv' },
      },
    });
    
    console.log('Successfully created tenant:', tenant);
    
    // Clean up
    await prisma.tenant.delete({
      where: { id: tenant.id },
    });
    
    console.log('Successfully connected to the database and performed operations.');
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 