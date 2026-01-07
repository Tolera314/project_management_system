import { Router } from 'express';
import {
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
