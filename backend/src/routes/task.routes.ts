import { Router } from 'express';
import { createTask, updateTask, deleteTask, getTaskDetails, addComment, addAssignee, removeAssignee, watchTask, unwatchTask, archiveTask, restoreTask, searchTasks, bulkUpdateTasks, duplicateTask, getTasks, addTaskDependency, getTaskActivity, addTagToTask, removeTagFromTask, updateComment, deleteComment } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkProjectPermission } from '../middleware/permissions';

const router = Router();

router.use(authMiddleware);

// Search & Filtering
router.get('/search', searchTasks);

// Bulk Actions
router.patch('/bulk', checkProjectPermission('edit_task'), bulkUpdateTasks);

// Task Management
router.get('/', getTasks); // Added getTasks route
router.post('/', checkProjectPermission('create_task'), createTask);
router.patch('/:id', checkProjectPermission('edit_task'), updateTask);
router.delete('/:id', checkProjectPermission('delete_task'), deleteTask);
router.post('/:id/duplicate', checkProjectPermission('create_task'), duplicateTask);
router.get('/:id', getTaskDetails);

// Comments
router.post('/:id/comments', checkProjectPermission('comment_task'), addComment);
router.put('/comments/:id', authMiddleware, updateComment);
router.delete('/comments/:id', authMiddleware, deleteComment);

// Assignees
router.post('/:id/assignees', checkProjectPermission('assign_task'), addAssignee);
router.delete('/:id/assignees/:memberId', checkProjectPermission('assign_task'), removeAssignee);

// Dependencies
router.post('/:id/dependencies', checkProjectPermission('edit_task'), addTaskDependency); // Added addTaskDependency route

// Activity
router.get('/:id/activity', getTaskActivity); // Added getTaskActivity route

// Watchers
router.post('/:id/watch', watchTask);
router.delete('/:id/watch', unwatchTask);

// Tags
router.post('/:id/tags', checkProjectPermission('edit_task'), addTagToTask); // Added addTagToTask route
router.delete('/:id/tags/:tagId', checkProjectPermission('edit_task'), removeTagFromTask); // Added removeTagFromTask route

// Archiving
router.post('/:id/archive', checkProjectPermission('edit_task'), archiveTask);
router.post('/:id/restore', checkProjectPermission('edit_task'), restoreTask);

export default router;
