import Vote from '../models/Vote.model.js';
import Post from '../models/Post.model.js';
import Comment from '../models/Comment.model.js';

export const castVote = async (req, res) => {
    try {
        const { targetId, targetType, value } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!targetId || !targetType || value === undefined) {
            return res.status(400).json({
                success: false,
                message: "targetId, targetType, and value are required"
            });
        }

        if (![1, -1].includes(value)) {
            return res.status(400).json({
                success: false,
                message: "value must be 1 or -1"
            });
        }

        // Determine model
        const modelMap = {
            post: Post,
            comment: Comment
        };
        const TargetModel = modelMap[targetType?.toLowerCase()];

        if (!TargetModel) {
            return res.status(400).json({
                success: false,
                message: "targetType must be 'post' or 'comment'"
            });
        }

        // Find target
        const idField = targetType === 'post' ? 'postId' : 'commentId';
        const target = await TargetModel.findOne({ [idField]: targetId });

        if (!target) {
            return res.status(404).json({
                success: false,
                message: `${targetType} not found`
            });
        }

        // Check for existing vote
        const existingVote = await Vote.findOne({ userId, targetId });

        let voteCountChange = 0;

        if (!existingVote) {
            // Scenario 1: no vote yet — create one
            await Vote.create({ userId, targetId, targetType, value });
            voteCountChange = value;

        } else if (existingVote.value === value) {
            // Scenario 2: same vote again — toggle off (remove vote)
            await Vote.deleteOne({ _id: existingVote._id });
            voteCountChange = -value;

        } else {
            // Scenario 3: opposite vote — flip it
            existingVote.value = value;
            await existingVote.save();
            voteCountChange = value * 2; // e.g. from -1 to +1 is a swing of 2
        }

        target.voteCount = (target.voteCount || 0) + voteCountChange;
        await target.save();

        return res.status(200).json({
            success: true,
            message: "Vote cast successfully",
            voteCount: target.voteCount
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${error.message}`
        });
    }
};
export default castVote;