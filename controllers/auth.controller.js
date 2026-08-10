import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import generateId from '../utils/generateId.js'


const generateToken = (userId) => {
    return jwt.sign({ userId }, env.jwtAccessSecret, { expiresIn: env.jwtExpiresIn })
}

export const register = async (req, res) => {
    try {
        const { username, email, password, } = req.body;

        const existingUser = await User.findOne({ $or: [{ username }, { email }] })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "The username or email provided already exists"
            });
        };

        const passwordHash = await bcrypt.hash(password, 10);

        const userId = generateId('user');

        const newUser = await User.create({
            userId,
            username,
            email,
            passwordHash

        });

        const userResponse = {
            userId: newUser.userId,
            username: newUser.username,
            email: newUser.email,
            avatar: newUser.avatar,
            token: generateToken(newUser.userId)
        };

        res.status(201).json({
            message: "User registered successfully",
            data: userResponse
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });

    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        };
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                userId: user.userId,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                createdAt: user.createdAt,
                token: generateToken(user.userId)
            }
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });

    }
}