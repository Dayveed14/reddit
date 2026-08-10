import request from 'supertest';

const { app } = await import('../server.js');

describe('Health & fallback', () => {
    it('GET /api/health should report ok', async () => {
        const res = await request(app).get('/api/health');

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.message).toBe('Server is running');
    });

    it('should return 404 for an unknown route', async () => {
        const res = await request(app).get('/api/does-not-exist');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            success: false,
            status: 404,
            message: 'Route /api/does-not-exist not found'
        });
    });
});
