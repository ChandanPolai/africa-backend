import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { notificationController } from './notification.controller.js';
import asyncHandler from 'express-async-handler';

const addToFavorites = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { favoriteUserId } = req.body;

    // Check if already favorited
    const existingFavorite = await models.Favourite.findOne({ userId, favoriteUserId, isDeleted: false });
    if (existingFavorite) {
        return response.conflict("Already added to favorites!", res);
    }

    // Add to favorites
    await models.Favourite.create({ userId, favoriteUserId });
    await models.User.findByIdAndUpdate(
        favoriteUserId,
        { $inc: { favoriteCount: 1 } }
    )
    // Get user details
    const favoritedUser = await models.User.findById(favoriteUserId);
    const currentUser = await models.User.findById(userId);

    // Check if notification should be sent
    if (favoritedUser?.membershipStatus && !favoritedUser._id.equals(userId)) {
        // Using the notification service with preference check
        await myservice.service.createNotification({
            type: notificationTypes.PROFILE_FAVORITES,
            userId: favoritedUser._id,
            triggeredBy: userId,
            title: "New Favorite",
            description: `${currentUser?.name || "Someone"} added you to favorites`,
            message: "",
            relatedEntity: userId
        });
    }

    return response.create("Added to favourites successfully!", {}, res);
})

const removeFromFavorites = asyncHandler(async (req, res) => {
    const { favoriteUserId } = req.body;

    let userId = req.user.userId;

    // Soft delete the favorite
    const favorite = await models.Favourite.findOneAndUpdate(
        { userId, favoriteUserId, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (favorite) {


        await models.User.findByIdAndUpdate(
            favoriteUserId,
            { $inc: { favoriteCount: -1 } }
        )
    };

    if (!favorite) {
        return response.noContent("Favorite not found!", res);
    }

    return response.success("Removed from favorites successfully!", true, res);
})

const getFavorites = asyncHandler(async (req, res) => {

    const { page, limit } = req.body;
    const userId = req.user.userId;

    const options = {
        page: page || 1,
        limit: limit || 20,
        populate: {
            path: 'favoriteUserId',
            select: 'name businessName userType subcategories profilePic mobile_number email', populate: [{
                path: 'userType',
                select: 'type name'
            }, {
                path: 'subcategories',
                select: 'key value'
            }]
        },
        sort: { createdAt: -1 } // Sort by latest favorites
    };

    const result = await models.Favourite.paginate(
        {
            userId,
            isDeleted: false,
            favoriteUserId: { $ne: null, $exists: true }, // ⛔ exclude null and missing
        },
        options
    );



    return response.success("Favorites retrieved successfully!", {
        favorites: result.docs,
        page: result.page,
        limit: result.limit,
        totalFavorites: result.totalDocs,
        totalPages: result.totalPages
    }, res);
})

const getUserFavorites = asyncHandler(async (req, res) => {
    const { userId, page, limit } = req.body;

    const options = {
        page: page || 1,
        limit: limit || 20,
        populate: {
            path: 'favoriteUserId',
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

    const result = await models.Favourite.paginate(
        {
            userId: userId,
            isDeleted: false,
            favoriteUserId: { $ne: null, $exists: true } // Exclude null/missing
        },
        options
    );

    return response.success("User favorites retrieved successfully!", {
        favorites: result.docs,
        page: result.page,
        limit: result.limit,
        totalFavorites: result.totalDocs,
        totalPages: result.totalPages
    }, res);
})

export const favouriteController = {
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    getUserFavorites
}