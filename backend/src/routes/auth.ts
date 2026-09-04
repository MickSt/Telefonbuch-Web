import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/login - Redirect to Azure AD login
router.get('/login', (req: Request, res: Response) => {
  const authUrl = AuthService.getAuthCodeUrl();
  res.json({ authUrl });
});

// GET /api/auth/callback - Handle Azure AD callback (GET from Azure AD redirect)
router.get('/callback', async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const { user, accessToken } = await AuthService.handleCallback(code);

    req.session.user = user;
    req.session.accessToken = accessToken;
    
    // Explicitly save session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).send('Session save failed');
      }
      res.redirect('/');
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Auth callback error:', message);
    res.status(401).send(`${message}. <a href="/">Back to Login</a>`);
  }
});

// POST /api/auth/callback - Handle callback from frontend (for SPA)
router.post('/callback', async (req: AuthRequest, res: Response) => {
  try {
    console.log('Auth callback POST received');
    const { code } = req.body;

    if (!code) {
      console.log('Auth callback POST: Missing code');
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const { user, accessToken } = await AuthService.handleCallback(code);

    req.session.user = user;
    req.session.accessToken = accessToken;
    console.log('Auth callback POST: Session created for user', user.email);

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Auth callback POST error:', message);
    res.status(401).json({ error: message });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json(req.user);
});

// POST /api/auth/logout - Logout
router.post('/logout', (req: AuthRequest, res: Response) => {
  req.session?.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

export default router;
