import { Router } from 'express';
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  getTaskById, 
  searchTasks, 
  getTasksByProject, 
  getTasksByAssignee, 
  updateTaskStatus,
  updateTaskPosition,
  addTaskDependency,
  removeTaskDependency,
  getTaskDependencies
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Task CRUD routes
router.post('/', authenticate, createTask);
router.get('/:id', authenticate, getTaskById);
router.patch('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

// Task status and position updates
router.patch('/:id/status', authenticate, updateTaskStatus);
router.patch('/:id/position', authenticate, updateTaskPosition);

// Task dependencies
router.post('/:id/dependencies', authenticate, addTaskDependency);
router.delete('/:id/dependencies/:dependencyId', authenticate, removeTaskDependency);
router.get('/:id/dependencies', authenticate, getTaskDependencies);

// Task search and filtering
router.get('/', authenticate, searchTasks);
router.get('/project/:projectId', authenticate, getTasksByProject);
router.get('/assignee/:assigneeId', authenticate, getTasksByAssignee);

export default router;
