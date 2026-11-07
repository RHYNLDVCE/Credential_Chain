import jwt from 'jsonwebtoken';
import config from '../config.js';
import { errorResponse } from '../utils/response.js';

export const getAuthenticatedUser = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
};

export const requireAuth = (request, ...allowedRoles) => {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return {
      authorized: false,
      errorResponse: errorResponse('Authentication required. Missing or invalid Bearer token.', 401),
      user: null,
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      errorResponse: errorResponse(
        `Access denied. Role "${user.role}" is not authorized for this operation.`,
        403
      ),
      user,
    };
  }

  return { authorized: true, user, errorResponse: null };
};

export default {
  getAuthenticatedUser,
  requireAuth,
};
