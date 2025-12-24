import { Router } from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  updateTaskPosition,
  addTaskDependency,
  removeTaskDependency,
  getTaskDependencies,
  searchTasks,
  getTasksByProject,
  getTasksByAssignee,
  updateTaskStatus
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all task routes
router.use(authenticate);

// Task CRUD routes
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.get('/:id', getTaskById);

// Task position and status updates
router.patch('/:taskId/position', updateTaskPosition);
router.patch('/:taskId/status', updateTaskStatus);

// Task dependencies
router.post('/:taskId/dependencies', addTaskDependency);
router.delete('/:taskId/dependencies/:dependencyId', removeTaskDependency);
router.get('/:taskId/dependencies', getTaskDependencies);

// Task search and filtering
router.get('/project/:projectId', getTasksByProject);
router.get('/assignee/:assigneeId', getTasksByAssignee);
router.get('/search', searchTasks);

export default router;
