import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
    communityId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: String, required: true },
    moderators: { type: [String], default: [] },
    memberCount: { type: Number, default: 1 },
    avatar: { type: String },
    banner: { type: String },
    rules: {
        type: [
            {
                title: { type: String },
                description: { type: String }
            }
        ],
    },
}, { timestamps: true });

const Community = mongoose.model('Community', communitySchema);
export default Community;