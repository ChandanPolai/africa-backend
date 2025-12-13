
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import { notificationController } from './notification.controller.js';

// const createFeed = asyncHandler(async (req, res) => {
//     const userId = req.user.userId;
//     if (!userId) {
//         return response.unauthorized("User not authenticated!", res);
//     }

//     const { description, title } = req.body;

//     let images = [];
//     if (req.files && req.files.length > 0) {
//         images = req.files.map(file => file.path.replace(/\\/g, '/'));
//     }

//     const feed = await models.Feed.create({
//         userId,
//         description,
//         images,
//         title,
//     });

//     const feedCreator = await models.User.findById(userId);
//     if (!feedCreator) {
//         return response.serverError("Feed creator not found", res);
//     }
//     await models.User.findByIdAndUpdate(
//         userId,
//         {
//             $inc: { feedCount: 1 }
//         })
//     if (feedCreator.membershipStatus !== true) {
//         return response.success("Feed created successfully (No notifications sent due to inactive membership)!", { feed }, res);
//     }

//     // Get followers with valid notification preferences
//     const followers = await models.Follower.find({
//         followedUserId: userId
//     }).populate({
//         path: 'userId',
//         select: 'fcm name',
//         match: {
//             'fcm': { $exists: true, $ne: null }
//         }
//     });


//     const validFollowers = followers.filter(f =>
//         f.userId && !f.userId._id.equals(userId)
//     );

//     for (const follower of validFollowers) {
//         await myservice.service.createNotification({
//             type: notificationTypes.FEED_FROM_FOLLOWERS,
//             userId: follower.userId._id,
//             triggeredBy: userId,
//             title: "New Post Alert 🚀",
//             description: `${feedCreator.name || "Someone"} just posted a new feed!`,
//             message: "",
//             relatedEntity: feed._id
//         });
//     }

//     return response.success("Feed created successfully!", { feed }, res);
// })

const createFeed = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return response.unauthorized("User not authenticated!", res);
    }

    // Check if user has already posted a feed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingFeedToday = await models.Feed.findOne({
        userId,
        createdAt: { $gte: today }
    });

    if (existingFeedToday) {
        return response.badRequest("You can only post one feed per day", res);
    }

    const { description, title } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.path.replace(/\\/g, '/'));
    }

    const feed = await models.Feed.create({
        userId,
        description,
        images,
        title,
    });

    const feedCreator = await models.User.findById(userId);
    if (!feedCreator) {
        return response.serverError("Feed creator not found", res);
    }
    await models.User.findByIdAndUpdate(
        userId,
        {
            $inc: { feedCount: 1 }
        })
    if (feedCreator.membershipStatus !== true) {
        return response.success("Feed created successfully (No notifications sent due to inactive membership)!", { feed }, res);
    }

    // Get followers with valid notification preferences
    const followers = await models.Follower.find({
        followedUserId: userId
    }).populate({
        path: 'userId',
        select: 'fcm name',
        match: {
            'fcm': { $exists: true, $ne: null }
        }
    });

    

    const validFollowers = followers.filter(f =>
        f.userId && !f.userId._id.equals(userId)
    );

    for (const follower of validFollowers) {
        await myservice.service.createNotification({
            type: notificationTypes.FEED_FROM_FOLLOWERS,
            userId: follower.userId._id,
            triggeredBy: userId,
            title: "New Post Alert 🚀",
            description: `${feedCreator.name || "Someone"} just posted a new feed!`,
            message: "",
            relatedEntity: feed._id,
             entityType: 'feed'
        });
    }

    return response.success("Feed created successfully!", { feed }, res);
});

const likeFeed = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { feedId } = req.body;


    const existingLike = await models.Like.findOne({ userId, feedId, isDeleted: false });
    if (existingLike) {
        return response.conflict("Already liked this feed!", res);
    }


    await models.Like.create({ userId, feedId });


    const feed = await models.Feed.findByIdAndUpdate(feedId, { $inc: { likeCount: 1 } });


    const feedOwner = await models.User.findById(feed.userId);
    if (!feedOwner) {
        return response.noContent("Feed owner not found", res);
    }


    if (feedOwner._id.equals(userId)) {
        return response.success("Feed liked successfully!", {}, res);
    }

    const liker = await models.User.findById(userId);

    if (feedOwner.membershipStatus && feedOwner.notificationPreferences?.postInteractions) {

        await myservice.service.createNotification({
            type: notificationTypes.POST_INTERACTION,
            userId: feedOwner._id,
            triggeredBy: userId,
            title: "New Like",
            description: `${liker?.name || "Someone"} liked your feed!`,
            message: "",
           
            relatedEntity: userId, // Add this
            entityType: 'feed' ,// Add this
        });
    }
    return response.success("Feed liked successfully!", true, res);
})

const deleteFeed = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const { feedId } = req.body;


    const feed = await models.Feed.findOneAndUpdate(
        { _id: feedId, userId, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );
    if (feed) {
        await models.User.findByIdAndUpdate(userId, { $inc: { feedCount: -1 } })
    }

    if (!feed) {
        return response.noContent("Feed not found or unauthorized!", res);
    }

    return response.success("Feed deleted successfully!", true, res);
})



const getFeeds = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const totalFeeds = await models.Feed.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalFeeds / limit);


    const feeds = await models.Feed
        .find({ isDeleted: false })
        .populate({
            path: 'userId',
            select: 'name profilePic mobile_number email business',
            populate: [
                {
                    path: 'business',
                    select: 'business_name business_type sub_category'
                },
            ]
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);


   const feedsWithLikes = await Promise.all(feeds.map(async (feed) => {
    const feedData = feed.toObject();
    let isLiked = false, isFollowing = false, isFavourite = false;

    if (feed.userId && feed.userId._id) {
        const [like, follow, favorite] = await Promise.all([
            models.Like.findOne({ userId, feedId: feed._id, isDeleted: false }),
            models.Follower.findOne({ userId, followedUserId: feed.userId._id, isDeleted: false }),
            models.Favourite.findOne({ userId, favoriteUserId: feed.userId._id, isDeleted: false })
        ]);

        isLiked = !!like;
        isFollowing = !!follow;
        isFavourite = !!favorite;
    }

    return {
        ...feedData,
        isLiked,
        isFollowing,
        isFavourite
    };
}));

    return response.success("Feeds retrieved successfully!", {
        page,
        limit,
        totalFeeds,
        totalPages,
        feeds: feedsWithLikes
    }, res);
})

const getOwnFeeds = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return res.status(403).json({ message: "Please authenticate first" });
    }

    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const totalFeeds = await models.Feed.countDocuments({ userId, isDeleted: false });
    const totalPages = Math.ceil(totalFeeds / limit);

    const feeds = await models.Feed
        .find({ userId, isDeleted: false })
        .populate({
            path: 'userId',
            select: 'name businessName profilePic',

        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const feedsWithLikes = await Promise.all(feeds.map(async (feed) => {
        const isLiked = await models.Like.findOne({ userId, feedId: feed._id, isDeleted: false });
        return {
            ...feed.toObject(),
            isLiked: !!isLiked
        };
    }));

    return response.success("Feeds retrieved successfully!", {
        page,
        limit,
        totalFeeds,
        totalPages,
        feeds: feedsWithLikes
    }, res);
})

const FeedsOfSpecificUsers = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, userId } = req.body;
    const currentUser = req.user.userId;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return response.error("Invalid user ID", res);
    }

    const ObjectId = new mongoose.Types.ObjectId(userId);

    const totalFeeds = await models.Feed.countDocuments({ userId: ObjectId, isDeleted: false });
    const totalPages = Math.ceil(totalFeeds / limit);

    const feeds = await models.Feed
        .find({ userId: ObjectId, isDeleted: false })
        .populate({
            path: 'userId',
            select: 'name businessName profilePic',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const feedsWithLikes = await Promise.all(feeds.map(async (feed) => {
        // Convert currentUser to ObjectId to ensure proper matching
        const currentUserObjectId = new mongoose.Types.ObjectId(currentUser);

        // Check if the current user has liked this feed
        const isLiked = await models.Like.findOne({
            userId: currentUserObjectId,
            feedId: feed._id,
            isDeleted: false
        });


        return {
            ...feed.toObject(),
            isLiked: !!isLiked
        };
    }));

    return response.success("Feeds retrieved successfully!", {
        page,
        limit,
        totalFeeds,
        totalPages,
        feeds: feedsWithLikes
    }, res);
})

const unlikeFeed = asyncHandler(async (req, res) => {
    const userId = req.user.userId
    const { feedId } = req.body;

    // Soft delete the like
    const like = await models.Like.findOneAndUpdate(
        { userId, feedId, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!like) {
        return response.noContent("Like not found!", res);
    }

    // Decrement like count
    await models.Feed.findByIdAndUpdate(feedId, { $inc: { likeCount: -1 } });

    return response.success("Feed unliked successfully!", true, res);
})

const addComment = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { feedId, comment } = req.body;

    const feedExists = await models.Feed.findById(feedId);
    if (!feedExists) {
        return response.noContent("Feed not found!", res);
    }


    const newComment = await models.Comment.create({ userId, feedId, comment });


    await models.Feed.findByIdAndUpdate(
        feedId,
        {
            $inc: { commentCount: 1 },
            $push: { comments: newComment._id }
        }
    );


    const feedOwner = await models.User.findById(feedExists.userId);


    if (feedOwner?.membershipStatus && !feedOwner._id.equals(userId)) {
        const commenter = await models.User.findById(userId);


        await notificationController.NotificationService.createNotification({
            type: notificationTypes.POST_INTERACTION,
            userId: feedOwner._id,
            triggeredBy: userId,
            title: "New Comment",
            description: `${commenter?.name || "Someone"} commented on your feed: "${comment}"`,
            relatedEntity:userId , // Add this
            entityType: 'feed' ,// Add this
            message: "",
            relatedEntity: feedId
        });
    }


    const populatedComment = await models.Comment.findOne({ _id: newComment._id, isDeleted: false })
        .populate({
            path: 'userId',
            select: 'name profilePic mobile_number email business',
            populate: [
                {
                    path: 'business',
                    select: 'business_name business_type sub_category'
                },
            ]
        })

    return response.success("Comment added successfully!", populatedComment, res);
})

const deleteComment = asyncHandler(async (req, res) => {
    const { userId, commentId } = req.body;


    const comment = await models.Comment.findOneAndUpdate(
        { _id: commentId, userId, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!comment) {
        return response.noContent("Comment not found or unauthorized!", res);
    }


    await models.Feed.findByIdAndUpdate(comment.feedId, { $inc: { commentCount: -1 } });


    return response.success("Comment deleted successfully!", true, res);
})

const getComments = asyncHandler(async (req, res) => {
    const { feedId, page = "1", limit = "10" } = req.body;
    const comments = await models.Comment.find({ feedId, isDeleted: false })
        .populate({
            path: 'userId',
            select: 'name profilePic mobile_number email business',
            populate: [
                {
                    path: 'business',
                    select: 'business_name business_type sub_category'
                },
            ]
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const totalComments = await models.Comment.countDocuments({ feedId, isDeleted: false });

    return response.success("Comments retrieved successfully!", {
        comments,
        totalPages: Math.ceil(totalComments / limit),
        page: parseInt(page),
        limit,
        totalComments
    }, res);
})

const saveFeed = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return response.success("User not authenticated!", null, res);
    }
    const { feedId } = req.body;


    const feed = await models.Feed.findOne({ _id: feedId });

    if (!feed) {
        return response.success("Feed not found or has been deleted", null, res);
    }

    // Check if user already saved this feed
    const user = await models.User.findOne({
        _id: userId,
        'savedFeeds.feedId': feedId
    });

    if (user) {
        return response.conflict("Feed already saved", res);
    }

    // Save the feed
    await Promise.all([
        models.User.findByIdAndUpdate(userId, {
            $push: { savedFeeds: { feedId } }
        }),
        models.Feed.findByIdAndUpdate(feedId, {
            $inc: { savedCount: 1 }
        })
    ]);

    return response.success("Feed saved successfully!", true, res);
})

const unsaveFeed = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { feedId } = req.body;

    const result = await models.User.findByIdAndUpdate(userId, {
        $pull: { savedFeeds: { feedId } }
    });

    if (!result) {
        return response.noContent("User not found", res);
    }

    // Decrement saved count
    await models.Feed.findByIdAndUpdate(feedId, {
        $inc: { savedCount: -1 }
    });

    return response.success("Feed unsaved successfully!", true, res);
})

const getSavedFeeds = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.body;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: {
            path: 'savedFeeds.feedId',
            match: { isDeleted: false },
            populate: {
                path: 'userId',
                select: 'name profilePic'
            }
        }
    };

    const result = await models.User.paginate(
        { _id: userId },
        options
    );

    // Filter out null feeds (deleted ones)
    const savedFeeds = result.docs[0].savedFeeds.filter(item => item.feedId);

    return response.success("Saved feeds retrieved successfully", {
        savedFeeds,
        totalFeeds: savedFeeds.length,
        totalPages: Math.ceil(savedFeeds.length / options.limit),
        limit,
        page

    }, res);
})

export const feedController = {
    createFeed,
    likeFeed,
    deleteFeed,
    getFeeds,
    getOwnFeeds,
    FeedsOfSpecificUsers,
    unlikeFeed,
    addComment,
    deleteComment,
    getComments,
    saveFeed,
    unsaveFeed,
    getSavedFeeds
}
