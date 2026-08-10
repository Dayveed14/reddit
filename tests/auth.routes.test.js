import { jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockUser = {
    findOne: jest.fn(),
    create: jest.fn()
};

jest.unstable_mockModule('../models/User.model.js', () => ({
    default: mockUser
}));

const { app } = await import('../server.js');
const { env } = await import('../config/env.js');

describe('Auth Routes API', () => {
    describe('POST /api/auth/register', () => {
        it('should return 400 if the username or email is already taken', async () => {
            mockUser.findOne.mockResolvedValue({ username: 'alice' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'alice', email: 'alice@example.com', password: 'password123' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'The username or email provided already exists'
            });
            expect(mockUser.create).not.toHaveBeenCalled();
        });

        it('should register a new user and return a valid token', async () => {
            mockUser.findOne.mockResolvedValue(null);
            mockUser.create.mockImplementation(async (payload) => ({
                ...payload,
                avatar: undefined
            }));

            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'newuser', email: 'new@example.com', password: 'password123' });

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('User registered successfully');
            expect(res.body.data).toMatchObject({
                username: 'newuser',
                email: 'new@example.com'
            });
            expect(res.body.data.userId).toMatch(/^USER_/);

            // The returned token should be valid and carry the new user's userId
            const decoded = jwt.verify(res.body.data.token, env.jwtAccessSecret);
            expect(decoded.userId).toBe(res.body.data.userId);

            // Password should have been hashed, never stored/returned in plaintext
            const createArgs = mockUser.create.mock.calls[0][0];
            expect(createArgs.passwordHash).not.toBe('password123');
            expect(await bcrypt.compare('password123', createArgs.passwordHash)).toBe(true);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 401 if the email does not exist', async () => {
            mockUser.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'ghost@example.com', password: 'whatever' });

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                message: 'Invalid email or password'
            });
        });

        it('should return 401 if the password is incorrect', async () => {
            const passwordHash = await bcrypt.hash('correct-password', 10);
            mockUser.findOne.mockResolvedValue({
                userId: 'u1',
                username: 'alice',
                email: 'alice@example.com',
                passwordHash
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'alice@example.com', password: 'wrong-password' });

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({
                success: false,
                message: 'Invalid email or password'
            });
        });

        it('should log in successfully with correct credentials', async () => {
            const passwordHash = await bcrypt.hash('correct-password', 10);
            mockUser.findOne.mockResolvedValue({
                userId: 'u1',
                username: 'alice',
                email: 'alice@example.com',
                avatar: null,
                createdAt: '2026-01-01T00:00:00.000Z',
                passwordHash
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'alice@example.com', password: 'correct-password' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toMatchObject({
                userId: 'u1',
                username: 'alice',
                email: 'alice@example.com'
            });

            const decoded = jwt.verify(res.body.data.token, env.jwtAccessSecret);
            expect(decoded.userId).toBe('u1');
        });
    });
});
