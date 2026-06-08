import { supabaseAdmin } from '../services/supabase.js';

/**
 * Supabase JWT authentication middleware.
 * Extracts Bearer token from Authorization header and verifies it via Supabase.
 * Attaches decoded user to req.user on success.
 */
export default async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = header.split(' ')[1];

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }

    // Attach user to request
    req.user = { 
      id: user.id, 
      email: user.email, 
      name: user.user_metadata?.name || 'Unknown User' 
    };
    
    // Also attach the raw token so routes can pass it to Supabase if they need RLS
    req.userJwt = token;
    
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error:', err.message);
    return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
  }
}

