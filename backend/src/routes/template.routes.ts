import { Router } from 'express';
import {
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    convertProjectToTemplate,
    useTemplate
} from '../controllers/template.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getTemplates);
router.post('/convert/:id', convertProjectToTemplate);
router.post('/use/:id', useTemplate);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
