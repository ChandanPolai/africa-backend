
import { response } from "../../utils/response.js";

import { models } from "../../models/zindex.js";





const blockUser = async (req, res) => {
    try {
        
        const {blockerUserId ,blockedUserId } = req.body;
        if (blockerUserId.toString() === blockedUserId) {
            return response.error("Cannot block yourself", 402,res);
        }

        const [blocker, blocked] = await Promise.all([
            models.User.findById(blockerUserId),
            models.User.findById(blockedUserId)
        ]);
        
        if (!blocker || !blocked) {
            return response.error("User not found", res);
        }

        const existingBlock = await models.blockedUsers.findOne({ 
            blockerUserId, 
            blockedUserId 
        });

        if (existingBlock) {
            return response.success("User already blocked", false, res);
        }

        const block = new models.blockedUsers({
            blockerUserId,
            blockedUserId
        });

        await block.save();

        await Promise.all([
            models.User.findByIdAndUpdate(blockerUserId, {
                $addToSet: { blockedUsers: blockedUserId },
                $inc: { blockCount: 1 }
            }),
            models.User.findByIdAndUpdate(blockedUserId, {
                $addToSet: { blockedByUsers: blockerUserId }
            })
        ]);

        
        
               
           
     

        return response.success("User blocked successfully", true, res);

    } catch (error) {
        return response.error(error,500, res);
    }
};
const unblockUser = async (req, res) => {
    try {
       

        const {blockerUserId,blockedUserId } = req.body;

      
        const result = await models.blockedUsers.findOneAndDelete({ 
            blockerUserId, 
            blockedUserId 
        });

        if (!result) {
            return response.success(" user Already unblocked", false,res);
        }

       
        await Promise.all([
            models.User.findByIdAndUpdate(blockerUserId, {
                $pull: { blockedUsers: blockedUserId },
                $inc: { blockCount: -1 }
            }),
            models.User.findByIdAndUpdate(blockedUserId, {
                $pull: { blockedByUsers: blockerUserId }
            })
        ]);

        return response.success("User unblocked successfully", true, res);

    } catch (error) {
        return response.error(error,500, res);
    }
};
const getBlockedUsers = async (req, res) => {
    try {
        const{userId, page=1,limit=10} = req.body; 
        

        
        const blockedUsers = await models.blockedUsers.find({ blockerUserId: userId })
            .populate('blockedUserId', 'name profilePic chapter_name mobile_number')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalUsers = await models.blockedUsers.countDocuments({ blockerUserId: userId });
        const totalPages = Math.ceil(totalUsers / limit);

        
        const formattedBlockedUsers = blockedUsers.map(item => ({
            ...item.blockedUserId.toObject(), 
           
        }));

        return response.success("Blocked users retrieved successfully", { 
            blockedUsers: formattedBlockedUsers,
            page,
            limit, 
            totalUsers,
            totalPages
        }, res);

    } catch (error) {
        return response.error(error, 500, res);
    }
};



const checkBlockStatus = async (req, res) => {
    try {
        const { error, value } = validator.checkBlockStatus.validate(req.params);
        if (error) return response.failure(error.message, null, res);

        const userId = req.token._id;
        const { otherUserId } = value;

        const isBlocked = await models.blockedUsers.findOne({
            $or: [
                { blockerUserId: userId, blockedUserId: otherUserId },
                { blockerUserId: otherUserId, blockedUserId: userId }
            ]
        });

        return response.success("Block status checked", { 
            isBlocked: !!isBlocked,
            data: isBlocked 
        }, res);

    } catch (err) {
        return response.error(err, res);
    }
};




export const blockController = {
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkBlockStatus
};

