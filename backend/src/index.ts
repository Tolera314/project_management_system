import dotenv from 'dotenv';
// Load environment variables immediately after import
dotenv.config();

import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import workspaceRoutes from './routes/workspace.routes';
import taskRoutes from './routes/task.routes';

const app = express();
// const prisma = new PrismaClient(); // Removed local instance
const port = process.env.PORT || 4000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/workspace', workspaceRoutes);
apiRouter.use('/tasks', taskRoutes);

// Mount API routes under /api
app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('ProjectOS Backend Running');
});

// Test database connection
prisma.$connect()
    .then(() => {
        console.log('✅ Database connected successfully');
    })
    .catch((error: unknown) => {
        if (error instanceof Error) {
            console.error('❌ Database connection failed:', error.message);
        } else {
            console.error('❌ Database connection failed:', error);
        }
    });

const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

export { app, prisma };
