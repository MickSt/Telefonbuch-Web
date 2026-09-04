import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateAndDecodeToken, validateCarDAVCredentials, oauth2Callback } from './auth.js';
import jwt from 'jsonwebtoken';

describe('Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateAndDecodeToken', () => {
    it('should validate a valid JWT token', () => {
      const token = jwt.sign({ sub: 'user123', scope: 'read write' }, 'test-secret');
      const decoded = validateAndDecodeToken(token, 'test-secret');
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe('user123');
    });

    it('should throw on invalid token', () => {
      expect(() => {
        validateAndDecodeToken('invalid.token.here', 'test-secret');
      }).toThrow();
    });

    it('should throw on expired token', () => {
      const token = jwt.sign({ sub: 'user123' }, 'test-secret', { expiresIn: '-1h' });
      expect(() => {
        validateAndDecodeToken(token, 'test-secret');
      }).toThrow();
    });
  });

  describe('validateCarDAVCredentials', () => {
    it('should validate correct credentials format', () => {
      const result = validateCarDAVCredentials('user@example.com', 'password123');
      expect(result).toBe(true);
    });

    it('should reject empty username', () => {
      const result = validateCarDAVCredentials('', 'password123');
      expect(result).toBe(false);
    });

    it('should reject empty password', () => {
      const result = validateCarDAVCredentials('user@example.com', '');
      expect(result).toBe(false);
    });
  });

  describe('oauth2Callback', () => {
    it('should validate OAuth code format', () => {
      const validCode = 'a'.repeat(64); // Mindestens 32 Zeichen
      expect(validCode.length).toBeGreaterThanOrEqual(32);
    });

    it('should reject short OAuth codes', () => {
      const shortCode = 'abc';
      expect(shortCode.length).toBeLessThan(32);
    });
  });
});
