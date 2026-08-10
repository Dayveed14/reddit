import Post from '../models/Post.model.js';
import generateId from '../utils/generateId.js';


    export const getAllPost = async (req, res) => {
        try {
            const { communityId, sort, page = 1, limit = 20, search } = req.query;

            const filter = {};
            if (communityId) filter.communityId = communityId;
            if (search) filter.$text = { $search: search };

            const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
            const skip = (Number(page) - 1) * Number(limit);

            const allPosts = await Post.find(filter)
                .sort(sortOrder)
                .skip(skip)
                .limit(Number(limit));

            const total = await Post.countDocuments(filter);

            return res.status(200).json({
                success: true,
                message: "All posts fetched successfully",
                total,
                page: Number(page),
                data: allPosts
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: `Server Error: ${error.message}`
            });
        }
    };

export const getPost = async (req, res) => {

    try {
        const { postId } = req.params;

        const post = await Post.findOne({ postId });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "No post found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Post fetched successfully",
            data: post
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};


export const createPost = async (req, res) => {

    try {
        const { title, body, communityId } = req.body;

        if (!title) return res.status(400).json({
            success: false,
            message: 'Post title is required'
        });

        if (!communityId)
            return res.status(400).json({
                success: false,
                message: 'Post requires a community'
            });

        const postId = generateId('post');
        const author = req.user.username
        const post = await Post.create({
            postId,
            communityId,
            title,
            body,
            image: req.file ? req.file.path : null,
            author
        });

        return res.status(201).json({
            success: true,
            data: post
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findOne({ postId });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const userId = req.user.userId;
        const isAuthor = post.author === req.user.username;

        if (!isAuthor) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this post",
            });
        }

        await post.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${error.message}`
        });
    }
};