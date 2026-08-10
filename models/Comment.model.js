import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    commentId: { type: String, required: true, unique: true, trim: true },
    body: { type: String, required: true, trim: true },
    author: { type: String, required: true },
    postId: { type: String, required: true },
    parentCommentId: { type: String, default: null },
    voteCount: { type: Number, default: 0 },
}, { timestamps: true })


const Comment = mongoose.model('Comment', commentSchema);
export default Comment;