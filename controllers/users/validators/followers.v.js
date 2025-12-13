let joi = require('joi');

exports.followUser = joi.object().keys({
    //userId: joi.string().required(), // User who is following
    followedUserId: joi.string().required(), // User being followed
});

exports.unfollowUser = joi.object().keys({
    
    followedUserId: joi.string().required(), // User being unfollowed
});

exports.getFollowers = joi.object().keys({
    page:joi.number().optional().default(1),
    limit: joi.number().optional().default(20),
});
// Add these to your existing validator
exports.getUserFollowers = joi.object().keys
   ({
        userId: joi.string().required(), // The user whose followers we want to get
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(20)
    });


exports.getUserFollowing = joi.object().keys
({
        userId: joi.string().required(), // The user whose following we want to get
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(20)
    });




exports.getFollowing = joi.object().keys({
    page:joi.number().optional().default(1),
    limit: joi.number().optional().default(20), 
});

exports.getFeedsOfFollowedUsers = joi.object().keys({
    userId: joi.string().required(), // User whose followed users' feeds are being retrieved
});


