import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    targetId: { type: String, required: true },
    targetType: { type: String, required: true, enum: ['post', 'comment'] },
    value: { type: Number, enum: [1, -1] },
}, { timestamps: true })

voteSchema.index({ userId: 1, targetId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;