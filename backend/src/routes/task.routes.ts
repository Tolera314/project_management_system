import { Router } from 'express';
import { createTask, updateTask, deleteTask, getTaskDetails, addComment, addAssignee, removeAssignee, watchTask, unwatchTask, archiveTask, restoreTask, searchTasks, bulkUpdateTasks } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.use(authMiddleware);

router.post('/', checkProjectPermission('create_task'), createTask);
router.patch('/:id', checkProjectPermission('edit_task'), updateTask);
router.delete('/:id', checkProjectPermission('delete_task'), deleteTask);
router.get('/:id', getTaskDetails);

// Search & Filtering
router.get('/search', searchTasks);

// Bulk Actions
router.patch('/bulk', checkProjectPermission('edit_task'), bulkUpdateTasks);

// Comments
router.post('/:id/comments', checkProjectPermission('comment'), addComment);

// Assignees
router.post('/:id/assignees', checkProjectPermission('assign_task'), addAssignee);
router.delete('/:id/assignees/:memberId', checkProjectPermission('assign_task'), removeAssignee);

// Watchers
router.post('/:id/watch', watchTask);
router.delete('/:id/watch', unwatchTask);

// Archiving
router.post('/:id/archive', checkProjectPermission('edit_task'), archiveTask);
router.post('/:id/restore', checkProjectPermission('edit_task'), restoreTask);

export default router;
