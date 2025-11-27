// services/sessionLifecycle.js
const supabase = require('../database/supabaseClient');

const INACTIVITY_MINUTES = 30; // 30 mins timeout
const ABSOLUTE_DAYS = 30;      // absolute max 30 days

function calculateExpiresAt(now = new Date()) {
  const inactivityMs = INACTIVITY_MINUTES * 60 * 1000;
  const absoluteMs = ABSOLUTE_DAYS * 24 * 60 * 60 * 1000;

  const inactivityExpiry = new Date(now.getTime() + inactivityMs);
  const absoluteExpiry = new Date(now.getTime() + absoluteMs);

  return new Date(Math.min(inactivityExpiry.getTime(), absoluteExpiry.getTime()));
}

/**
 * Create a session row in public.user_session
 *
 * @param {Object} params
 * @param {number} params.userId          - public.users.user_id (int)
 * @param {string} params.accessToken
 * @param {string|null} [params.ipAddress]
 * @param {string|null} [params.userAgent]
 * @returns {Promise<{sessionId:number|null, sessionExpiresAt:string|null}>}
 */
async function createSession({
  userId,
  accessToken,
  ipAddress = null,
  userAgent = null,
}) {
  const now = new Date();
  const expiresAt = calculateExpiresAt(now);

  const { data, error } = await supabase
    .from('user_session')
    .insert({
      user_id: userId,
      session_token: accessToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_activity_at: now.toISOString(),
    })
    .select('id, expires_at')
    .single();   

  if (error) {
    console.error('[sessionLifecycle] Failed to insert session:', error);
    throw error;
  }

  return {
    sessionId: data?.id ?? null,
    sessionExpiresAt: data?.expires_at ?? null,
  };
}

module.exports = {
  createSession,
  calculateExpiresAt,
};
