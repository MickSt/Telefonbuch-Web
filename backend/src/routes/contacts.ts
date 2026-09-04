import { Router, Response } from 'express';
import { z } from 'zod';
import { CardDAVService } from '../services/CardDAVService.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schema for search query
const searchSchema = z.object({
  search: z.string().max(100).optional(),
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/contacts - Get all contacts with optional search
router.get('/', (req: AuthRequest, res: Response) => {
  const result = searchSchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid search query' });
  }

  const { search } = result.data;

  let contacts = CardDAVService.getContacts();

  if (search) {
    contacts = CardDAVService.searchContacts(search);
  }

  res.json(contacts);
});

// GET /api/contacts/:id - Get single contact
router.get('/:id', (req: AuthRequest, res: Response) => {
  const idSchema = z.string().min(1).max(255);
  const idResult = idSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  const contact = CardDAVService.getContact(idResult.data);

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json(contact);
});

export default router;
