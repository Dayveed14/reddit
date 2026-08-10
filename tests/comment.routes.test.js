import { jest } from '@jest/globals';
import request from 'supertest';

const mockComment = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
};

const mockPost = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn()
};

const mockUser = {
    findOne: jest.fn()
};

jest.unstable_mockModule('../models/Comment.model.js', () => ({ default: mockComment }));
jest.unstable_mockModule('../models/Post.model.js', () => ({ default: mockPost }));
jest.unstable_mockModule('../models/User.model.js', () => ({ default: mockUser }));

const { app } = await import('../server.js');
const { loggedInUser, tokenFor } = await import('./helpers/auth.js');

describe('Comment Routes API', () => {
    describe('GET /api/comment/:postId', () => {
        it('should return comments for a post', async () => {
            const comments = [{ commentId: 'CMT_1', body: 'nice post', postId: 'POST_1' }];
            mockComment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(comments) });

            const res = await request(app).get('/api/comment/POST_1');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({
                success: true,
                message: 'Comments fetched successfully',
                data: comments
            });
        });

        it('should return an empty list when a post has no comments', async () => {
            mockComment.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

            const res = await request(app).get('/api/comment/POST_1');

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual([]);
        });
    });

    describe('POST /api/comment', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app)
                .post('/api/comment')
                .send({ postId: 'POST_1', body: 'nice post' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 when the comment body is missing', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);

            const res = await request(app)
                .post('/api/comment')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ postId: 'POST_1' });

            expect(res.statusCode).toBe(400);
            expect(res.body).toEqual({
                success: false,
                message: 'Comment field is required'
            });
        });

        it('should return 404 when the postId is missing', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);

            const res = await request(app)
                .post('/api/comment')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ body: 'nice post' });

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({
                success: false,
                message: 'No post to comment'
            });
        });

        it('should return 404 when the referenced post does not exist', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockPost.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/comment')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ postId: 'POST_1', body: 'nice post' });

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({
                success: false,
                message: 'Post not found'
            });
        });

        it('should create a comment on an existing post', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockPost.findOne.mockResolvedValue({ postId: 'POST_1' });
            const newComment = {
                commentId: 'CMT_abc',
                postId: 'POST_1',
                body: 'nice post',
                author: 'alice'
            };
            mockComment.create.mockResolvedValue(newComment);

            const res = await request(app)
                .post('/api/comment')
                .set('Authorization', `Bearer ${tokenFor('u1')}`)
                .send({ postId: 'POST_1', body: 'nice post' });

            expect(res.statusCode).toBe(201);
            expect(res.body).toEqual({
                success: true,
                message: 'Comment created successfully',
                data: newComment
            });
            expect(mockPost.findOneAndUpdate).toHaveBeenCalledWith(
                { postId: 'POST_1' },
                { $inc: { commentCount: 1 } }
            );
        });
    });

    describe('DELETE /api/comment/:commentId', () => {
        it('should return 401 when no token is provided', async () => {
            const res = await request(app).delete('/api/comment/CMT_1');
            expect(res.statusCode).toBe(401);
        });

        it('should return 404 if the comment does not exist', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockComment.findOne.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/comment/CMT_1')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(404);
            expect(res.body).toEqual({ success: false, message: 'No comment found' });
        });

        it('should return 403 if the requester is not the author', async () => {
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockComment.findOne.mockResolvedValue({
                commentId: 'CMT_1',
                author: 'someone-else',
                postId: 'POST_1',
                deleteOne: jest.fn()
            });

            const res = await request(app)
                .delete('/api/comment/CMT_1')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(403);
            expect(res.body).toEqual({
                success: false,
                message: 'You are not authorized to delete this comment'
            });
        });

        it('should delete the comment when the requester is the author', async () => {
            const deleteOne = jest.fn().mockResolvedValue({});
            mockUser.findOne.mockResolvedValue(loggedInUser);
            mockComment.findOne.mockResolvedValue({
                commentId: 'CMT_1',
                author: 'alice',
                postId: 'POST_1',
                deleteOne
            });

            const res = await request(app)
                .delete('/api/comment/CMT_1')
                .set('Authorization', `Bearer ${tokenFor('u1')}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({ success: true, message: 'Comment deleted successfully' });
            expect(deleteOne).toHaveBeenCalled();
            expect(mockPost.findOneAndUpdate).toHaveBeenCalledWith(
                { postId: 'POST_1' },
                { $inc: { commentCount: -1 } }
            );
        });
    });
});
