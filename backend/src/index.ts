import dotenv from 'dotenv';
// Load environment variables immediately after import
dotenv.config();

import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import workspaceRoutes from './routes/workspace.routes';
import listRoutes from './routes/list.routes';
import taskRoutes from './routes/task.routes';
import milestoneRoutes from './routes/milestone.routes';
import dependencyRoutes from './routes/dependency.routes';
import invitationRoutes from './routes/invitation.routes';

const app = express();
// const prisma = new PrismaClient(); // Removed local instance
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/lists', listRoutes);
app.use('/tasks', taskRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/dependencies', dependencyRoutes);
app.use('/invitations', invitationRoutes);

app.get('/', (req, res) => {
    res.send('ProjectOS Backend Running');
});

// Test database connection
prisma.$connect()
    .then(() => {
        console.log('✅ Database connected successfully');
    })
    .catch((error) => {
        console.error('❌ Database connection failed:', error.message);
    });

const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

export { app, prisma };
