import { Router } from 'express';
import { getUsers, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), getUsers);

router.patch('/:id', authorize('admin'), validate(updateUserSchema), updateUser);

router.delete('/:id', authorize('admin'), deleteUser);

export default router;
