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
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';
import tagRoutes from './routes/tag.routes';
import fileRoutes from './routes/file.routes';
import templateRoutes from './routes/template.routes';
import adminRoutes from './routes/admin.routes';

import { createServer } from 'http';
import { SocketService } from './services/socket.service';

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);

// Initialize Socket.io
SocketService.initialize(httpServer);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/lists', listRoutes);
app.use('/tasks', taskRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/dependencies', dependencyRoutes);
app.use('/invitations', invitationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/templates', templateRoutes);
app.use('/users', userRoutes);
app.use('/tags', tagRoutes);
app.use('/files', fileRoutes);
app.use('/admin', adminRoutes);

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

const server = httpServer.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

export { app, prisma, httpServer, server };
