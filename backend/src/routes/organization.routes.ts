import { Router, Request, Response, NextFunction } from 'express';
import { 
  createOrganization, 
  getOrganization, 
  updateOrganization, 
  deleteOrganization, 
  getOrganizationMembers, 
  addOrganizationMember, 
  removeOrganizationMember, 
  updateMemberRole 
} from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes with authentication
router.use((req: Request, res: Response, next: NextFunction) => {
  return authenticate(req as any, res, next);
});

// Organization CRUD
router.post('/', (req: Request, res: Response, next: NextFunction) => 
  createOrganization(req as any, res, next));

router.get('/:id', (req: Request, res: Response, next: NextFunction) => 
  getOrganization(req as any, res, next));

router.put('/:id', (req: Request, res: Response, next: NextFunction) => 
  updateOrganization(req as any, res, next));

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => 
  deleteOrganization(req as any, res, next));

// Organization Members
router.get('/:id/members', (req: Request, res: Response, next: NextFunction) => 
  getOrganizationMembers(req as any, res, next));

router.post('/:id/members', (req: Request, res: Response, next: NextFunction) => 
  addOrganizationMember(req as any, res, next));

router.delete('/:id/members/:memberId', (req: Request, res: Response, next: NextFunction) => 
  removeOrganizationMember(req as any, res, next));

router.put('/:id/members/:memberId/role', (req: Request, res: Response, next: NextFunction) => 
  updateMemberRole(req as any, res, next));

export default router;
