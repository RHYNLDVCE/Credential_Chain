import { successResponse, errorResponse } from '../lib/utils/response.js';
import authService from '../lib/services/authService.js';
import dbService from '../lib/services/dbService.js';

export const AuthController = {
  async login(request) {
    try {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return errorResponse('Email and password are required', 400);
      }

      const result = await authService.login(email, password);
      return successResponse(result, 'Login successful');
    } catch (err) {
      return errorResponse(err.message || 'Authentication failed', 401);
    }
  },

  async loginWithMetaMask(request) {
    try {
      const body = await request.json();
      const { address, signature, message } = body;

      if (!address || !signature || !message) {
        return errorResponse('Address, cryptographic signature, and challenge message are required', 400);
      }

      const result = await authService.loginWithMetaMask(address, signature, message);
      return successResponse(result, 'MetaMask authentication successful');
    } catch (err) {
      return errorResponse(err.message || 'MetaMask authentication failed', 401);
    }
  },

  async getMe(user) {
    try {
      const profile = await dbService.findUserById(user.id);
      return successResponse(profile || user, 'Current session retrieved');
    } catch (err) {
      return errorResponse(err.message || 'Failed to fetch user profile', 500);
    }
  },

  async register(request) {
    try {
      const body = await request.json();
      const { email, password, name, role, department } = body;

      if (!email || !password || !name) {
        return errorResponse('Email, password, and name are required', 400);
      }

      const newUser = await authService.registerUser({ email, password, name, role, department });
      return successResponse(newUser, 'User registered successfully', 201);
    } catch (err) {
      return errorResponse(err.message || 'Registration failed', 400);
    }
  },

  async listUsers() {
    try {
      const users = await dbService.listUsers();
      return successResponse(users, 'User registry retrieved');
    } catch (err) {
      return errorResponse(err.message || 'Failed to list users', 500);
    }
  },
};

export default AuthController;
