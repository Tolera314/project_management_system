
// @ts-nocheck
import prisma from '../src/lib/prisma';

async function main() {
    try {
        const project = await prisma.project.findFirst();
        if (!project) {
            console.log('No projects found.');
            return;
        }

        console.log('Converting project to template:', project.name, project.id);

        await prisma.project.update({
            where: { id: project.id },
            data: {
                isTemplate: true,
                description: 'Converted to template for testing'
            }
        });

        console.log('Success! Project is now a template.');
    } catch (e) {
        console.error(e);
    }
}

main();
