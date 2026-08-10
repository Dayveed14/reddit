import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ---- Mock the User model so tests never touch a real database ----
const mockUser = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn()
};

jest.unstable_mockModule('../models/User.model.js', () => ({
    default: mockUser
}));

// Dynamic imports so they pick up the mocked module above
const { app } = await import('../server.js');
const { env } = await import('../config/env.js');

// Helper to build a valid Bearer token for a given userId
const tokenFor = (userId) => jwt.sign({ userId }, env.jwtAccessSecret, { expiresIn: '1h' });

describe('User Routes API', () => {
    describe('GET /api/users', () => {
        it('should return 404 when there are no users', async () => {
            mockUser.find.mockResolvedValue([]);

            const res = await request(app).get('/api/users');

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ message: 'No users found' });
        });

        it('should return all users when users exist', async () => {
            const users = [
                { userId: 'u1', username: 'alice' },
                { userId: 'u2', username: 'bob' }
            ];
            mockUser.find.mockResolvedValue(users);

            const res = await request(app).get('/api/users');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                message: 'Users found',
                totalUsers: 2,
                data: users
            });
        });
    });

    describe('GET /api/users/:username', () => {
        it('should return a user profile if the username exists', async () => {
            const user = { userId: 'u1', username: 'alice', bio: 'hi there' };
            mockUser.findOne.mockResolvedValue(user);

            const res = await request(app).get('/api/users/alice');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Profile retrieved successfully',
                data: user
            });
            expect(mockUser.findOne).toHaveBeenCalledWith({ username: 'alice' });
        });

        it('should return 404 if the username does not exist', async () => {
            mockUser.findOne.mockResolvedValue(null);

            const res = await request(app).get('/api/users/ghost');

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({
                success: false,
                message: 'User profile not found'
            });
        });
    });

    describe('PUT /api/users/me', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app)
                .put('/api/users/me')
                .send({ bio: 'new bio' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Not authorized, no token provided');
        });

        it('should return 401 when the token is invalid', async () => {
            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', 'Bearer not-a-real-token')
                .send({ bio: 'new bio' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Not authorized, token failed');
        });

        it('should return 401 when the token is valid but the user no longer exists', async () => {
            mockUser.findOne.mockResolvedValue(null); // protect() lookup fails

            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${tokenFor('ghost-user')}`)
                .send({ bio: 'new bio' });

            expect(res.statusCode).toBe(401);
            expect(res.body).toEqual({ success: false, message: 'User not found' });
        });

        it('should update the profile for an authenticated user', async () => {
            const loggedInUser = { _id: 'mongo-id-1', userId: 'u1', username: 'alice' };
            const updatedUser = { _id: 'mongo-id-1', userId: 'u1', username: 'alice', bio: 'new bio' };

            mockUser.findOne.mockResolvedValue(loggedInUser); // protect() lookup succeeds
            mockUser.findByIdAndUpdate.mockResolvedValue(updatedUser);

            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ bio: 'new bio' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Profile updated',
                data: updatedUser
            });
            expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(
                'mongo-id-1',
                { bio: 'new bio' },
                { new: true, runValidators: true }
            );
        });

        it('should return 404 if the authenticated user was deleted before the update applies', async () => {
            const loggedInUser = { _id: 'mongo-id-1', userId: 'u1', username: 'alice' };

            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockUser.findByIdAndUpdate.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ bio: 'new bio' });

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ success: false, message: 'User not found' });
        });
    });

    describe('POST /api/users/me/avatar', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app).post('/api/users/me/avatar');

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when no image file is attached', async () => {
            const loggedInUser = { _id: 'mongo-id-1', userId: 'u1', username: 'alice' };
            mockUser.findOne.mockResolvedValue(loggedInUser);

            const res = await request(app)
                .post('/api/users/me/avatar')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'No image file provided'
            });
        });
    });
});
