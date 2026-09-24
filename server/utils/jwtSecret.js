// Single source of truth for the JWT signing secret.
// Production refuses to boot without JWT_SECRET (see server.js fail-fast),
// so this fallback only ever applies in development.
function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set in production');
  }
  return 'default_jwt_secret';
}

module.exports = { getJwtSecret };
