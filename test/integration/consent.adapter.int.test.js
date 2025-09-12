// test/integration/consent.adapter.int.test.js
require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const supabase = require('../../new_utils/supabaseAdmin');
const app = require('../../server');

const USER = '11111111-1111-1111-1111-111111111111';   // valid UUID
const SCOPE = 'medical';

describe('Integration: getConsentFor (real adapter via API)', () => {
  beforeAll(async () => {
  const { error } = await supabase
    .from('consents')
    .upsert([{
      user_id: USER,                            // UUID
      user_email: 'test@example.com',           // required by schema
      consent_type: SCOPE,
      granted: true,
      metadata: {}
    }], { onConflict: 'user_id,consent_type' });
  if (error) throw error;
});

  it('returns normalized { userId, scope, status }', async () => {
    const res = await request(app)
      .get(`/api/consents/${USER}/status`)
      .query({ consent_type: SCOPE })
      .expect(200);

    expect(res.body).toMatchObject({ userId: USER, scope: SCOPE, status: 'granted' });
  });
});
