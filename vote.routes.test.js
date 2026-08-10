import { jest } from '@jest/globals';
import request from 'supertest';

const mockVote = {
    findOne: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn()
};

const mockPost = {
    findOne: jest.fn()
};

const mockComment = {
    findOne: jest.fn()
};

const mockUser = {
    findOne: jest.fn()
};

jest.unstable_mockModule('../models/Vote.model.js', () => ({ default: mockVote }));
jest.unstable_mockModule('../models/Post.model.js', () => ({ default: mockPost }));
jest.unstable_mockModule('../models/Comment.model.js', () => ({ default: mockComment }));
jest.unstable_mockModule('../models/User.model.js', () => ({ default: mockUser }));

const { app } = await import('../server.js');
const { loggedInUser, tokenFor } = await import('./helpers/auth.js');

const authedRequest = () =>
    request(app).post('/api/vote').set('Authorization', `Bearer ${tokenFor('u1')}`);

describe('Vote Routes API', () => {
    beforeEach(() => {
        mockUser.findOne.mockResolvedValue(loggedInUser);
    });

    it('should return 401 when no token is provided', async () => {
        const res = await request(app)
            .post('/api/vote')
            .send({ targetId: 'POST_1', targetType: 'post', value: 1 });

        expect(res.statusCode).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
        const res = await authedRequest().send({ targetType: 'post', value: 1 });

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'targetId, targetType, and value are required'
        });
    });

    it('should return 400 when value is not 1 or -1', async () => {
        const res = await authedRequest().send({ targetId: 'POST_1', targetType: 'post', value: 2 });

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ success: false, message: 'value must be 1 or -1' });
    });

    it('should return 400 when targetType is invalid', async () => {
        const res = await authedRequest().send({ targetId: 'POST_1', targetType: 'story', value: 1 });

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: "targetType must be 'post' or 'comment'"
        });
    });

    it('should return 404 when the target post does not exist', async () => {
        mockPost.findOne.mockResolvedValue(null);

        const res = await authedRequest().send({ targetId: 'POST_1', targetType: 'post', value: 1 });

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ success: false, message: 'post not found' });
    });

    it('should create a new upvote when none exists yet', async () => {
        const save = jest.fn().mockResolvedValue({});
        const target = { postId: 'POST_1', voteCount: 0, save };
        mockPost.findOne.mockResolvedValue(target);
        mockVote.findOne.mockResolvedValue(null);
        mockVote.create.mockResolvedValue({});

        const res = await authedRequest().send({ targetId: 'POST_1', targetType: 'post', value: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Vote cast successfully',
            voteCount: 1
        });
        expect(mockVote.create).toHaveBeenCalledWith({
            userId: 'u1',
            targetId: 'POST_1',
            targetType: 'post',
            value: 1
        });
        expect(save).toHaveBeenCalled();
    });

    it('should remove the vote when casting the same vote again (toggle off)', async () => {
        const save = jest.fn().mockResolvedValue({});
        const target = { postId: 'POST_1', voteCount: 1, save };
        mockPost.findOne.mockResolvedValue(target);
        mockVote.findOne.mockResolvedValue({ _id: 'vote-1', value: 1 });

        const res = await authedRequest().send({ targetId: 'POST_1', targetType: 'post', value: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.voteCount).toBe(0);
        expect(mockVote.deleteOne).toHaveBeenCalledWith({ _id: 'vote-1' });
    });

    it('should flip the vote when casting the opposite vote', async () => {
        const targetSave = jest.fn().mockResolvedValue({});
        const target = { postId: 'POST_1', voteCount: -1, save: targetSave };
        mockPost.findOne.mockResolvedValue(target);

        const voteSave = jest.fn().mockResolvedValue({});
        const existingVote = { _id: 'vote-1', value: -1, save: voteSave };
        mockVote.findOne.mockResolvedValue(existingVote);

        const res = await authedRequest().send({ targetId: 'POST_1', targetType: 'post', value: 1 });

        expect(res.statusCode).toBe(200);
        // -1 -> +1 is a swing of 2, so voteCount goes from -1 to 1
        expect(res.body.voteCount).toBe(1);
        expect(existingVote.value).toBe(1);
        expect(voteSave).toHaveBeenCalled();
    });

    it('should vote on a comment when targetType is comment', async () => {
        const save = jest.fn().mockResolvedValue({});
        const target = { commentId: 'CMT_1', voteCount: 0, save };
        mockComment.findOne.mockResolvedValue(target);
        mockVote.findOne.mockResolvedValue(null);
        mockVote.create.mockResolvedValue({});

        const res = await authedRequest().send({ targetId: 'CMT_1', targetType: 'comment', value: -1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.voteCount).toBe(-1);
        expect(mockComment.findOne).toHaveBeenCalledWith({ commentId: 'CMT_1' });
    });
});
