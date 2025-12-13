import joi from "joi";

const followUser = joi.object().keys({
    followedUserId: joi.string().required(),
});

const unfollowUser = joi.object().keys({

    followedUserId: joi.string().required(),
});

const getFollowers = joi.object().keys({
    page: joi.number().optional().default(1),
    limit: joi.number().optional().default(20),
});

const getUserFollowers = joi.object().keys
    ({
        userId: joi.string().required(),
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(20)
    });

const getUserFollowing = joi.object().keys
    ({
        userId: joi.string().required(),
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(20)
    });

const getFollowing = joi.object().keys({
    page: joi.number().optional().default(1),
    limit: joi.number().optional().default(20),
});

const getFeedsOfFollowedUsers = joi.object().keys({
    userId: joi.string().required(),
});

export const followersValidator = {
    followUser,
    unfollowUser,
    getFollowers,
    getUserFollowers,
    getUserFollowing,
    getFollowing,
    getFeedsOfFollowedUsers
}