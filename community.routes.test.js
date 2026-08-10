import { jest } from '@jest/globals';
import request from 'supertest';

const mockCommunity = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn()
};

const mockUser = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn()
};

jest.unstable_mockModule('../models/Community.model.js', () => ({ default: mockCommunity }));
jest.unstable_mockModule('../models/User.model.js', () => ({ default: mockUser }));

const { app } = await import('../server.js');
const { loggedInUser, tokenFor } = await import('./helpers/auth.js');

describe('Community Routes API', () => {
    describe('GET /api/community', () => {
        it('should return all communities', async () => {
            const communities = [{ communityId: 'COM_1', name: 'react', memberCount: 5 }];
            mockCommunity.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(communities) });

            const res = await request(app).get('/api/community');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Communities fetched successfully',
                total: 1,
                data: communities
            });
        });
    });

    describe('GET /api/community/:name', () => {
        it('should return a single community', async () => {
            const community = { communityId: 'COM_1', name: 'react' };
            mockCommunity.findOne.mockResolvedValue(community);

            const res = await request(app).get('/api/community/react');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Single community fetched successfully',
                data: community
            });
        });

        it('should return 404 if the community does not exist', async () => {
            mockCommunity.findOne.mockResolvedValue(null);

            const res = await request(app).get('/api/community/ghost');

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({
                success: false,
                message: 'Single community not found'
            });
        });
    });

    describe('POST /api/community', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app).post('/api/community').send({ name: 'react' });
            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when the name is missing', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/community')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ description: 'no name here' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'Community name is required'
            });
        });

        it('should return 400 when the community already exists', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue({ name: 'react' });

            const res = await request(app)
                .post('/api/community')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ name: 'react' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'Community already exist '
            });
        });

        it('should create a new community', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue(null);
            const newCommunity = {
                communityId: 'COM_abc',
                name: 'react',
                description: 'React developers',
                createdBy: 'alice',
                moderators: ['alice']
            };
            mockCommunity.create.mockResolvedValue(newCommunity);

            const res = await request(app)
                .post('/api/community')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ name: 'react', description: 'React developers' });

            expect(res.statusCode).toBe(201);
            expect(res.body).toEqual({
                success: true,
                message: 'Community created successfully ',
                community: newCommunity
            });
        });
    });

    describe('POST /api/community/:name/join', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app).post('/api/community/react/join');
            expect(res.statusCode).toBe(401);
        });

        it('should return 404 if the community does not exist', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/community/ghost/join')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ success: false, message: 'Community not found' });
        });

        it('should join an existing community', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue({ name: 'react', communityId: 'COM_1' });

            const res = await request(app)
                .post('/api/community/react/join')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Successfully joined r/react'
            });
            expect(mockCommunity.findOneAndUpdate).toHaveBeenCalledWith(
                { name: 'react' },
                { $inc: { memberCount: 1 } }
            );
            expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: 'u1' },
                { $addToSet: { communities: 'COM_1' } }
            );
        });
    });

    describe('POST /api/community/:name/leave', () => {
        it('should return 404 if the community does not exist', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/community/ghost/leave')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ success: false, message: 'Community not found' });
        });

        it('should leave an existing community', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockCommunity.findOne.mockResolvedValue({ name: 'react', communityId: 'COM_1' });

            const res = await request(app)
                .post('/api/community/react/leave')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Successfully left r/react'
            });
            expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: 'u1' },
                { $pull: { communities: 'COM_1' } }
            );
        });
    });

    describe('POST /api/community/:name/banner', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app).post('/api/community/react/banner');
            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when no image file is attached', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);

            const res = await request(app)
                .post('/api/community/react/banner')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({ success: false, message: 'No image provided' });
        });
    });
});
