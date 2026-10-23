import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProblem } from './problem';

test('reads RFC 9457 problem+json fields', () => {
  const error = parseProblem(401, {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    detail: 'Username or password is wrong.',
    code: 'unauthorized',
  });
  assert.equal(error.code, 'unauthorized');
  assert.equal(error.detail, 'Username or password is wrong.');
  assert.equal(error.status, 401);
});

test('exposes field errors and retryAfter', () => {
  const error = parseProblem(429, {
    code: 'rate_limited',
    detail: 'Too many attempts.',
    retryAfter: 30,
    errors: [{ field: 'pin', message: 'must be 4 digits' }],
  });
  assert.equal(error.retryAfter, 30);
  assert.equal(error.fieldMessage('pin'), 'must be 4 digits');
});
