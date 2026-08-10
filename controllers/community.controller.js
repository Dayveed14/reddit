import Community from '../models/Community.model.js';
import User from '../models/User.model.js';
import generateId from '../utils/generateId.js';


export const getCommunities = async (req, res) => {
    try {
        const community = await Community.find().sort({ memberCount: -1 })
        const total = community?.length;

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Communities not found",
            });

        }
        return res.status(200).json({
            success: true,
            message: "Communities fetched successfully",
            total,
            data: community
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};

export const getCommunity = async (req, res) => {
    try {
        const { name } = req.params
        const community = await Community.findOne({ name })

        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Single community not found",
            });

        }
        return res.status(200).json({
            success: true,
            message: "Single community fetched successfully",
            data: community
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};

export const createCommunity = async (req, res) => {
    try {
        const { name, description } = req.body
        const existingCommunity = await Community.findOne({ name });

        if (!name) return res.status(400).json({
            success: false,
            message: 'Community name is required'
        });

        if (existingCommunity) {
            return res.status(400).json({
                success: false,
                message: "Community already exist ",
            });
        }

        const moderators = [req.user.username];
        const createdBy = req.user.username;
        const communityId = generateId('community')

        const community = await Community.create({
            communityId, name, description,
            createdBy, moderators
        });

        return res.status(201).json({
            success: true,
            message: "Community created successfully ",
            community
        });



    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server Error: , ${error.message}`
        });
    }
};

export const joinCommunity = async (req, res) => {
    try {
        const { name } = req.params;

        // Verify if community actually exists
        const community = await Community.findOne({ name });
        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Community not found"
            });
        };
        let message;

        await Community.findOneAndUpdate(
            { name },
            { $inc: { memberCount: 1 } }
        )
        message = `Successfully joined r/${community.name}`;

        const user = await User.findOneAndUpdate(
            { userId: req.user.userId },
            { $addToSet: { communities: community.communityId } },
        )
        message = `Successfully joined r/${community.name}`;

        return res.status(200).json({
            success: true,
            message,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Server Error: ${error.message}`
        });
    }
};

export const leaveCommunity = async (req, res) => {
    try {
        const { name } = req.params;

        // Verify if community actually exists
        const community = await Community.findOne({ name });
        if (!community) {
            return res.status(404).json({
                success: false,
                message: "Community not found"
            });
        };
        let message;

        await Community.findOneAndUpdate(
            { name },
            { $inc: { memberCount: -1 } }
        )
        message = `Successfully left r/${community.name}`;

        const user = await User.findOneAndUpdate(
            { userId: req.user.userId },
            { $pull: { communities: community.communityId } },
        )
        message = `Successfully left r/${community.name}`;

        return res.status(200).json({
            success: true,
            message,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Server Error: ${error.message}`
        });
    }
};

export const uploadBanner = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' });
        
        const community = await Community.findOneAndUpdate(
            { name: req.params.name },
            { banner: req.file.path },
            { new: true }
        );
        
        res.status(200).json({ success: true, message: 'Banner updated', banner: community.banner });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};