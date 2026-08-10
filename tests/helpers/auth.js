import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

// A consistent "logged in" user shape used across protected-route tests.
export const loggedInUser = { _id: 'mongo-id-1', userId: 'u1', username: 'alice' };

export const tokenFor = (userId) =>
    jwt.sign({ userId }, env.jwtAccessSecret, { expiresIn: '1h' });
