import { describe, it, expect, vi } from 'vitest';
import { authService } from '../authService';

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([])
      }))
    }))
  }
}));

describe('AuthService', () => {
    it('should validate admin credentials correctly', async () => {
        process.env.ADMIN_PASSWORD = 'secret-password';
        
        const valid = await authService.validateAdmin('admin@example.com', 'secret-password');
        const invalidPass = await authService.validateAdmin('admin@example.com', 'wrong');
        const invalidEmail = await authService.validateAdmin('wrong@example.com', 'secret-password');
        
        expect(valid).toBeDefined();
        expect(valid?.role).toBe('superadmin');
        expect(invalidPass).toBeNull();
        expect(invalidEmail).toBeNull();
    });

    it('should return fixed admin user object', async () => {
        const user = await authService.findUserById('admin');
        expect(user).toBeDefined();
        expect(user?.role).toBe('superadmin');
        expect(user?.email).toBe('admin@example.com');
    });
});
