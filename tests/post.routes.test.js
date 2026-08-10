import { jest } from '@jest/globals';
import request from 'supertest';

const mockPost = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
};

const mockUser = {
    findOne: jest.fn()
};

jest.unstable_mockModule('../models/Post.model.js', () => ({ default: mockPost }));
jest.unstable_mockModule('../models/User.model.js', () => ({ default: mockUser }));

const { app } = await import('../server.js');
const { loggedInUser, tokenFor } = await import('./helpers/auth.js');

// Helper: mock the chainable Post.find(filter).sort().skip().limit() call
const makeFindChain = (result) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result)
});

describe('Post Routes API', () => {
    describe('GET /api/post', () => {
        it('should return a paginated list of posts', async () => {
            const posts = [{ postId: 'POST_1', title: 'Hello world' }];
            mockPost.find.mockReturnValue(makeFindChain(posts));
            mockPost.countDocuments.mockResolvedValue(1);

            const res = await request(app).get('/api/post');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'All posts fetched successfully',
                total: 1,
                page: 1,
                data: posts
            });
        });
    });

    describe('GET /api/post/:postId', () => {
        it('should return a single post', async () => {
            const post = { postId: 'POST_1', title: 'Hello world' };
            mockPost.findOne.mockResolvedValue(post);

            const res = await request(app).get('/api/post/POST_1');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Post fetched successfully',
                data: post
            });
        });

        it('should return 404 if the post does not exist', async () => {
            mockPost.findOne.mockResolvedValue(null);

            const res = await request(app).get('/api/post/does-not-exist');

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({
                success: false,
                message: 'No post found'
            });
        });
    });

    describe('POST /api/post', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app)
                .post('/api/post')
                .send({ title: 'New post', communityId: 'COM_1' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when the title is missing', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);

            const res = await request(app)
                .post('/api/post')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ communityId: 'COM_1' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'Post title is required'
            });
        });

        it('should return 400 when the community is missing', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);

            const res = await request(app)
                .post('/api/post')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ title: 'New post' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'Post requires a community'
            });
        });

        it('should create a post for an authenticated user', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            const createdPost = {
                postId: 'POST_abc',
                title: 'New post',
                communityId: 'COM_1',
                author: 'alice',
                image: null
            };
            mockPost.create.mockResolvedValue(createdPost);

            const res = await request(app)
                .post('/api/post')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ title: 'New post', communityId: 'COM_1' });

            expect(res.statusCode).toBe(201);
            expect(res.body).toEqual({ success: true, data: createdPost });
            expect(mockPost.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'New post',
                    communityId: 'COM_1',
                    author: 'alice',
                    image: null
                })
            );
        });
    });

    describe('DELETE /api/post/:postId', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app).delete('/api/post/POST_1');
            expect(res.statusCode).toBe(401);
        });

        it('should return 404 if the post does not exist', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockPost.findOne.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/post/does-not-exist')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ success: false, message: 'Post not found' });
        });

        it('should return 403 if the requester is not the author', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockPost.findOne.mockResolvedValue({
                postId: 'POST_1',
                author: 'someone-else',
                deleteOne: jest.fn()
            });

            const res = await request(app)
                .delete('/api/post/POST_1')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(403);
            expect(res.body).toEqual({
                success: false,
                message: 'You are not authorized to delete this post'
            });
        });

        it('should delete the post when the requester is the author', async () => {
            const deleteOne = jest.fn().mockResolvedValue({});
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockPost.findOne.mockResolvedValue({
                postId: 'POST_1',
                author: 'alice',
                deleteOne
            });

            const res = await request(app)
                .delete('/api/post/POST_1')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({ success: true, message: 'Post deleted successfully' });
            expect(deleteOne).toHaveBeenCalled();
        });
    });
});
