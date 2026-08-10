import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { env } from '../config/env.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {

        token = req.headers.authorization.split(' ')[1];
    }


    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, env.jwtAccessSecret);

        const loggedInUser = await User.findOne({ userId: decoded.userId });

        if (!loggedInUser) {
            return res.status(401).json({ success: false, message: 'User not found', });
        }
        req.user = loggedInUser;
        next()


    } catch (error) {
        return res.status(401).json({
            message: 'Not authorized, token failed',
            error: error.message,
        });
    }

}