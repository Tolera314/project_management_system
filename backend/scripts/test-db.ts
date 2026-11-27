
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB Connection...');
    try {
        const count = await prisma.user.count();
        console.log(`Connection Successful. User count: ${count}`);
    } catch (error) {
        console.error('Connection Failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
