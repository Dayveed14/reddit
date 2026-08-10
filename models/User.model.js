import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, trim: true },
    communities: { type: [String], default: [] },
    karma: { type: Number, default: 0 },
    bio: { type: String, trim: true },
    avatar: { type: String },
}, { timestamps: true });

// Prevent password from been retuned
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);
export default User;


// All 5 models are complete:

// User.js ✅
// Community.js ✅
// Post.js ✅
// Comment.js ✅
// Vote.js ✅