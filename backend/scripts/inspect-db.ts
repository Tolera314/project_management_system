
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting Database Tables...');
    try {
        const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
        console.log('--- Tables found ---');
        tables.forEach(t => console.log(`- ${t.table_name}`));

        const tableName = tables.find(t => t.table_name.toLowerCase() === 'user')?.table_name;
        if (tableName) {
            console.log(`\nInspecting columns for table: ${tableName}`);
            const columns: any[] = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);

            console.log('--- Columns ---');
            columns.forEach(col => {
                console.log(`- ${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('\nUser table NOT FOUND.');
        }

    } catch (error) {
        console.error('Inspection Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
