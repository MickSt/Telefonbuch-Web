import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from './AuthService.js';

test('extracts Microsoft OAuth error details', () => {
  const error = {
    response: {
      status: 400,
      data: {
        error: 'invalid_grant',
        error_description: 'AADSTS9002313: Invalid request.'
      }
    }
  };

  assert.equal(
    AuthService.extractErrorMessage(error),
    'Microsoft authentication failed: invalid_grant (AADSTS9002313: Invalid request.)'
  );
});
