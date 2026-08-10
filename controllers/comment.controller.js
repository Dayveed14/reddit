import Comment from '../models/Comment.model.js';
import generateId from '../utils/generateId.js';
import Post from '../models/Post.model.js';

export const getComments = async (req, res) => {

    try {
        const { postId } = req.params;

        const comments = await Comment.find({ postId }).sort({ createdAt: 1 });

        if (!comments) {
            return res.status(404).json({
                success: false,
                message: "No comments found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            data: comments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};


export const createComment = async (req, res) => {

    try {
        const { postId, body, parentCommentId } = req.body;

        if (!body) return res.status(400).json({
            success: false,
            message: 'Comment field is required'
        });

        if (!postId)
            return res.status(404).json({
                success: false,
                message: "No post to comment"
            });

        const post = await Post.findOne({ postId });

        if (!post)
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });

        await Post.findOneAndUpdate({ postId }, { $inc: { commentCount: 1 } });



        const commentId = generateId('comment');
        const author = req.user.username
        const newComment = await Comment.create({
            postId,
            commentId,
            parentCommentId,
            body,
            author
        });

        return res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: newComment
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findOne({ commentId });

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "No comment found",
            });
        }


        const isAuthor = comment.author === req.user.username;
        if (!isAuthor) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this comment",
            });
        };

        await comment.deleteOne();

        await Post.findOneAndUpdate(
            { postId: comment.postId },
            { $inc: { commentCount: -1 } }
        )

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });



    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${error.message}`
        });
    }
};