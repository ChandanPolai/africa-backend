import { models } from '../../models/zindex.js';
import { notificationController } from './notification.controller.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
/*const followUser = async (req, res) => {
    try {
        const { error, value } = validator.followUser.validate(req.body);
        if (error) {
            return response.success(error.details[0].message, 0, res);
        }

        const userId = req.user.userId;
        const { followedUserId } = value;

        // Check if user is already following
        const existingFollow = await models.followers.findOne({ userId, followedUserId, isDeleted: false });
        if (existingFollow) {
            return response.success("Already following this user!", false, res);
        }

        // Follow the user
        const follow = await models.followers.create({ userId, followedUserId });

        // Increment the followers count
        const followedUser = await models.users.findByIdAndUpdate(
            followedUserId,
            { $inc: { followersCount: 1 } },
            { new: true }
        );

        

        // Check if notification should be sent
        if (followedUser?.membershipStatus && !followedUser._id.equals(userId)) {
            const follower = await models.users.findById(userId);
            
            // Using the notification service with preference check
            await myservice.service.createNotification({
                type: notificationTypes.NEW_FOLLOWERS,
                userId: followedUser._id,
                triggeredBy: userId,
                title: "New Follower",
                description: `${follower?.name || "Someone"} followed you!`,
                message: "",
                relatedEntity: userId // Can reference the follower's profile
            });
        }

        return response.success("Followed user successfully!", true, res);
    } catch (err) {
        console.error("Error in followUser:", err);
        return response.error(err, res);
    }
};
  
const unfollowUser = async (req, res) => {
        const { error, value } = validator.unfollowUser.validate(req.body);
        if (error) {
            return response.success(error.details[0].message, 0, res);
        }
        const userId = req.user.userId; 

        const {  followedUserId } = value;

        // Soft delete the follow
        const follow = await models.followers.findOneAndUpdate(
            { userId, followedUserId, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!follow) {
            return response.success("Follow not found!", false, res);
        }

        // Decrement the followersCount for the followed user
        await models.users.findByIdAndUpdate(
            followedUserId,
            { $inc: { followersCount: -1 } } // Decrement by 1
        );

        return response.success("Unfollowed user successfully!", true, res);
    } catch (err) {
        return response.error(err, res);
    }
};
*/

const followUser = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { followedUserId } = req.body;

    // Check if user is already following
    const existingFollow = await models.Follower.findOne({ userId, followedUserId, isDeleted: false });
    if (existingFollow) {
        return response.conflict("Already following this user!", res);
    }

    // Follow the user
    const follow = await models.Follower.create({ userId, followedUserId });

    // Update both counts in parallel
    await Promise.all([
        // Increment the followed user's followers count
        models.User.findByIdAndUpdate(
            followedUserId,
            { $inc: { followersCount: 1 } }
        ),
        // Increment the current user's following count
        models.users.findByIdAndUpdate(
            userId,
            { $inc: { followingCount: 1 } }
        )
    ]);

    // Check if notification should be sent
    const followedUser = await models.User.findById(followedUserId);
    if (followedUser?.membershipStatus && !followedUser._id.equals(userId)) {
        const follower = await models.User.findById(userId);

        await notificationController.NotificationService.createNotification({
            type: notificationTypes.NEW_FOLLOWERS,
            userId: followedUser._id,
            triggeredBy: userId,
            title: "New Follower",
            description: `${follower?.name || "Someone"} followed you!`,
            message: "",
            relatedEntity: userId
        });
    }

    return response.success("Followed user successfully!", true, res);
})

const unfollowUser = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const { followedUserId } = req.body;

    // Soft delete the follow
    const follow = await models.Follower.findOneAndUpdate(
        { userId, followedUserId, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!follow) {
        return response.noContent("Follow not found!", res);
    }

    // Update both counts in parallel
    await Promise.all([
        // Decrement the followed user's followers count
        models.User.findByIdAndUpdate(
            followedUserId,
            { $inc: { followersCount: -1 } }
        ),
        // Decrement the current user's following count
        models.User.findByIdAndUpdate(
            userId,
            { $inc: { followingCount: -1 } }
        )
    ]);

    return response.success("Unfollowed user successfully!", true, res);
})

const getFollowers = asyncHandler(async (req, res) => {

    const userId = req.user.userId;
    const { page, limit } = req.body;

    const options = {
        page: page || 1,
        limit: limit || 20,
        populate: {
            path: 'userId',
            select: 'name business profilePic mobile_number email',
            populate: [
                {
                    path: 'business',
                    select: 'business_name business_type sub_category'
                },
            ]
        },
        sort: { createdAt: -1 }
    };

    const result = await models.Follower.paginate({ followedUserId: userId, isDeleted: false }, options);

    // Transform the response to match getFollowing structure
    const transformedFollowers = result.docs.map(follower => ({
        _id: follower._id,
        userId: follower.userId._id, // Keep the userId reference
        followedUserId: { // This matches getFollowing's structure
            _id: follower.userId._id,
            name: follower.userId.name,
            businessName: follower.userId.businessName,
            mobile_number: follower.userId.mobile_number,
            email: follower.userId.email,
            userType: follower.userId.userType,
            profilePic: follower.userId.profilePic,
            subcategories: follower.userId.subcategories
        },
        createdAt: follower.createdAt
    }));

    return response.success("Followers retrieved successfully!", {
        followers: transformedFollowers,
        page: result.page,
        limit: result.limit,
        followersCount: result.totalDocs,
        totalPages: result.totalPages
    }, res);
})

const getFollowing = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { page, limit } = req.body;

    const options = {
        page: page || 1,
        limit: limit || 20,
        populate: {
            path: 'followedUserId',
            select: 'name business userType subcategories profilePic mobile_number email',
            populate: [
                {
                    path: 'userType',
                    select: 'type name '
                },
                {
                    path: 'subcategories',
                    select: 'key value'
                }
            ]

        },
        sort: { createdAt: -1 } // Sort by latest following
    };

    const result = await models.Follower.paginate({ userId, isDeleted: false }, options);

    return response.success("Following retrieved successfully!", {
        following: result.docs,
        page: result.page,
        limit: result.limit,
        followingCount: result.totalDocs,
        totalPages: result.totalPages
    }, res);
})

const getFeedsOfFollowedUsers = asyncHandler(async (req, res) => {
    const { userId } = value;

    const following = await models.Follower.find({ userId, isDeleted: false })
        .populate('followedUserId', 'name business ');

    const followedUserIds = following.map(follow => follow.followedUserId._id);

    // Get feeds of followed users
    const feeds = await models.Feed.find({ userId: { $in: followedUserIds }, isDeleted: false })
        .populate('userId', 'name business profilePic mobile_number email');

    return response.success("Feeds of followed users retrieved successfully!", { feeds }, res);
})

const getUserFollowers = asyncHandler(async (req, res) => {
    const { userId, page, limit } = value;

    const options = {
        page: page || 1,
        limit: limit || 20,
        populate: {
            path: 'userId',
            select: 'name businessName userType subcategories profilePic mobile_number email',
            populate: [
                {
                    path: 'userType',
                    select: 'type name'
                },
                {
                    path: 'subcategories',
                    select: 'key value'
                }
            ]
        },
        sort: { createdAt: -1 }
    };

    const result = await models.Follower.paginate({
        followedUserId: userId,
        isDeleted: false
    }, options);

    return response.success("User followers retrieved successfully!", {
        followers: result.docs,
        page: result.page,
        limit: result.limit,
        followersCount: result.totalDocs,
        totalPages: result.totalPages
    }, res);
})

const getUserFollowing = asyncHandler(async (req, res) => {
    const { userId, page, limit } = value;

    const options = {
        page: page || 1,
        limit: limit || 20,
        populate: {
            path: 'followedUserId',
            select: 'name businessName userType subcategories profilePic mobile_number email',
            populate: [
                {
                    path: 'userType',
                    select: 'type name'
                },
                {
                    path: 'subcategories',
                    select: 'key value'
                }
            ]
        },
        sort: { createdAt: -1 }
    };

    const result = await models.Follower.paginate({
        userId: userId,
        isDeleted: false
    }, options);

    return response.success("User following retrieved successfully!", {
        following: result.docs,
        page: result.page,
        limit: result.limit,
        followingCount: result.totalDocs,
        totalPages: result.totalPages
    }, res);
})

export const followersController = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFeedsOfFollowedUsers,
    getUserFollowers,
    getUserFollowing
}