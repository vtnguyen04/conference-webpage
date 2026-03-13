import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { login, logout, getUser } from '../../controllers/auth.controller';
import { authService } from '../../services/authService';

const app = express();
app.use(express.json());
app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));

app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);
app.get('/api/auth/user', getUser);

vi.mock('../../services/authService');

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/auth/login - should log in admin with correct credentials', async () => {
    vi.mocked(authService.validateAdmin).mockResolvedValue(true);
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
  });

  it('POST /api/auth/login - should fail with wrong credentials', async () => {
    vi.mocked(authService.validateAdmin).mockResolvedValue(false);
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('GET /api/auth/user - should return user if session exists', async () => {
    vi.mocked(authService.findUserById).mockResolvedValue({ id: 'admin', role: 'admin' } as any);
    
    // Giả lập session bằng cách đăng nhập trước (hoặc mock session middleware)
    // Trong test này, Supertest không tự động giữ session qua các request độc lập mà không có agent
    const agent = request.agent(app);
    vi.mocked(authService.validateAdmin).mockResolvedValue(true);
    await agent.post('/api/auth/login').send({ email: 'admin', password: '1' });
    
    const res = await agent.get('/api/auth/user');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('admin');
  });
});
