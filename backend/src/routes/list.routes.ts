import { Router } from 'express';
import { createList, getProjectLists, updateList, deleteList, getListDetails } from '../controllers/list.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createList);
router.get('/project/:projectId', getProjectLists);
router.get('/details/:id', getListDetails);
router.patch('/:id', updateList);
router.delete('/:id', deleteList);

export default router;
