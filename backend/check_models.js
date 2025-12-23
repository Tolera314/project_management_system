
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Available models in Prisma Client:');
    const models = Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'));
    console.log(models);

    if (prisma.project) {
        console.log('Project model exists');
    } else {
        console.log('Project model MISSING');
    }

    if (prisma.projectDependency) {
        console.log('ProjectDependency model exists');
    } else {
        console.log('ProjectDependency model MISSING');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
