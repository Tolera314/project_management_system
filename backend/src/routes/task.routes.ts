import { Router } from 'express';
import {
    createTask,
    updateTask,
    deleteTask,
    getTaskDetails,
    addComment,
    addAssignee,
    removeAssignee
} from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createTask);
router.get('/:id', getTaskDetails);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

// Comments
router.post('/:id/comments', addComment);

// Assignees
router.post('/:id/assignees', addAssignee);
router.delete('/:id/assignees/:memberId', removeAssignee);

export default router;
