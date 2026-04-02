'use strict';

const { createToken, COOKIE } = require('../src/middleware/auth');

const TEST_FAMILY_ID = 'test-family-id';

const TEST_USER = {
  userId: 'test-user-id',
  email: 'test@example.com',
  familyId: TEST_FAMILY_ID,
  name: 'Test User',
  picture: null,
};

function authCookie() {
  const token = createToken(TEST_USER);
  return `${COOKIE}=${token}`;
}

// Helper to add auth cookie to supertest request
function withAuth(supertestRequest) {
  return supertestRequest.set('Cookie', authCookie());
}

module.exports = { authCookie, withAuth, TEST_USER, TEST_FAMILY_ID };
