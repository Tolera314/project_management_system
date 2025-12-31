import { Router } from 'express';
import { createTask, updateTask, deleteTask, getTaskDetails, addComment, addAssignee, removeAssignee } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.use(authMiddleware);

router.post('/', checkProjectPermission('create_task'), createTask);
router.patch('/:id', checkProjectPermission('edit_task'), updateTask);
router.delete('/:id', checkProjectPermission('delete_task'), deleteTask);
router.get('/:id', getTaskDetails);

// Comments
router.post('/:id/comments', checkProjectPermission('comment'), addComment);

// Assignees
router.post('/:id/assignees', checkProjectPermission('assign_task'), addAssignee);
router.delete('/:id/assignees/:memberId', checkProjectPermission('assign_task'), removeAssignee);

export default router;
