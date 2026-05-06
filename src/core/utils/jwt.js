/**
 * JWT helpers
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');

/**
 * Générer access token — avec type verification
 */
function generateAccessToken(userId, role = 'citizen') {
  return jwt.sign(
    {
      userId,
      role,
      type: 'access',  // IMPORTANT: token type
      iat: Math.floor(Date.now() / 1000),
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY_ACCESS, algorithm: 'HS256' }
  );
}

/**
 * Générer refresh token — avec type verification
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    {
      userId,
      type: 'refresh',  // IMPORTANT: token type
      iat: Math.floor(Date.now() / 1000),
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_EXPIRY_REFRESH, algorithm: 'HS256' }
  );
}

/**
 * Vérifier et décoder access token — avec type checking
 */
function verifyToken(token, expectedType = 'access') {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });

    // Vérifier type du token
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected '${expectedType}', got '${decoded.type}'`);
    }

    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (err.message.includes('Invalid token type')) {
      throw new Error(err.message);
    }
    throw new Error('Invalid token');
  }
}

/**
 * Vérifier et décoder refresh token — type check obligatoire
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    // Vérifier que c'est bien un refresh token
    if (decoded.type !== 'refresh') {
      throw new Error(`Invalid token type. Expected 'refresh', got '${decoded.type}'`);
    }

    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (err.message.includes('Invalid token type')) {
      throw new Error(err.message);
    }
    throw new Error('Invalid refresh token');
  }
}

/**
 * Extraire token du header Authorization
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
};
