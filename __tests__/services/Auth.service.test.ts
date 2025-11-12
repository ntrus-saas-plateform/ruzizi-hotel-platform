import { AuthService } from '@/services/Auth.service';
import { UserModel } from '@/models/User.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/models/User.model');
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
  dbConnect: jest.fn().mockResolvedValue({}),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'manager',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({
          id: 'user123',
          email: 'test@example.com',
          role: 'manager',
        }),
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid email', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login('invalid@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'manager',
        isActive: true,
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        AuthService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'manager',
        isActive: false,
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        AuthService.login('test@example.com', 'password123')
      ).rejects.toThrow('Account is inactive');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', () => {
      const payload = { userId: 'user123', role: 'manager' };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

      const result = AuthService.verifyToken(token);

      expect(result).toHaveProperty('userId', 'user123');
      expect(result).toHaveProperty('role', 'manager');
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        AuthService.verifyToken('invalid-token');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const payload = { userId: 'user123', role: 'manager' };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '0s' });

      // Wait a bit to ensure token expires
      setTimeout(() => {
        expect(() => {
          AuthService.verifyToken(token);
        }).toThrow();
      }, 100);
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token from valid refresh token', () => {
      const payload = { userId: 'user123', role: 'manager' };
      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

      const result = AuthService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      
      // Verify the new access token
      const decoded = jwt.verify(result.accessToken, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe('user123');
      expect(decoded.role).toBe('manager');
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        AuthService.refreshAccessToken('invalid-refresh-token');
      }).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'mypassword123';
      const hashed = await AuthService.hashPassword(password);

      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
      
      // Verify the hash
      const isValid = await bcrypt.compare(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'mypassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'mypassword123';
      const hashed = await bcrypt.hash(password, 10);

      const result = await AuthService.comparePassword(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'mypassword123';
      const hashed = await bcrypt.hash('differentpassword', 10);

      const result = await AuthService.comparePassword(password, hashed);

      expect(result).toBe(false);
    });
  });
});
