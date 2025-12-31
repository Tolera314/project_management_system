
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    try {
        const userId = 'cmjidpnco0006ygf32ujoa47a'; // From logs
        const memberships = await prisma.organizationMember.findMany({
            where: { userId },
            include: { organization: true }
        });
        console.log('Memberships:', JSON.stringify(memberships, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

check();
