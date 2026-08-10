import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    postId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, trim: true },
    image: { type: String },
    author: { type: String, required: true },
    communityId: { type: String, required: true },
    voteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
}, { timestamps: true })

postSchema.index({ title: 'text', body: 'text' });

const Post = mongoose.model('Post', postSchema);
export default Post;