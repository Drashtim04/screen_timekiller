import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validate token and return current user profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Extension Token Exchange (enabling the extension to authenticate via dashboard session)
router.post('/extension-sync', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    extensionAuthenticated: true,
    userId: req.user?.id
  });
});

export default router;
