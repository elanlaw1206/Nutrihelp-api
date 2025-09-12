// adapters/getConsentFor/real.js
const supabase = require('../../new_utils/supabaseAdmin'); // reuse your configured client

module.exports = async function getConsentFor(userId, scope) {
  // Build query and return an array; avoid maybeSingle/single for compatibility
  const { data, error } = await supabase
    .from('consents')
    .select('user_id, consent_type, granted')
    .eq('user_id', userId)
    .eq('consent_type', scope)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data; // handles both array/object
  if (!row) return { userId, scope, status: 'unknown' };

  return {
    userId: row.user_id,
    scope: row.consent_type,
    status: row.granted ? 'granted' : 'denied'
  };
};
