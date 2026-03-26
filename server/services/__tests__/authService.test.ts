import { describe, it, expect } from 'vitest';
import { authService } from '../authService';

describe('AuthService', () => {
    it('should validate admin credentials correctly', async () => {
        process.env.ADMIN_PASSWORD = 'secret-password';
        
        const valid = await authService.validateAdmin('admin@example.com', 'secret-password');
        const invalidPass = await authService.validateAdmin('admin@example.com', 'wrong');
        const invalidEmail = await authService.validateAdmin('wrong@example.com', 'secret-password');
        
        expect(valid).toBe(true);
        expect(invalidPass).toBe(false);
        expect(invalidEmail).toBe(false);
    });

    it('should return fixed admin user object', async () => {
        const user = await authService.findUserById('admin');
        expect(user).toBeDefined();
        expect(user?.role).toBe('admin');
        expect(user?.email).toBe('admin@example.com');
    });
});
