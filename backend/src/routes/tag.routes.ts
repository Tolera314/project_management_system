import { Router } from 'express';
import { getOrganizationTags, createTag, deleteTag, attachTagToTask, detachTagFromTask } from '../controllers/tag.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/org/:orgId', getOrganizationTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);
router.post('/attach', attachTagToTask);
router.delete('/detach/:taskId/:tagId', detachTagFromTask);

export default router;
