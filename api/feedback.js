// Vercel Serverless Function - saves feedback to Supabase
// Env vars needed: SUPABASE_URL, SUPABASE_ANON_KEY

module.exports = async function handler(req, res) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') return res.status(200).end();
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

      const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                return res.status(500).json({ error: 'Supabase not configured on server' });
      }

      const { type, session_id, value, message_index, comment } = req.body || {};

      if (!type || !session_id || value === undefined) {

          return res.status(400).json({ error: 'Missing required fields: type, session_id, value' });
      }

      try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
                              method: 'POST',
                              headers: {
                                                'Content-Type': 'application/json',
                                                'apikey': SUPABASE_ANON_KEY,
                                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                                'Prefer': 'return=minimal'
                              },
                              body: JSON.stringify({
                                                session_id,
                                                type,
                                                value: String(value),
                                                message_index: message_index ?? null,
                                                comment: comment ?? null
                              })
                });

                if (!response.ok) {
                              const errText = await response.text();
                                     return res.status(response.status).json({ error: errText });
                }

                return res.status(201).json({ ok: true });

      } catch (error) {
                return res.status(500).json({ error: error.message });
      }
};
                          
