const joi = require('joi');
const { join } = require('path');

exports.addToFavorites = joi.object().keys({
    //userId: joi.string().required(), // User who is adding to favorites
    favoriteUserId: joi.string().required(), // User or business profile being added to favorites
});

exports.removeFromFavorites = joi.object().keys({
    //userId: joi.string().required(), // User who is removing from favorites
    favoriteUserId: joi.string().required(), // User or business profile being removed from favorites
});

exports.getFavorites = joi.object().keys({
    page:joi.number().optional().default(1),
    limit: joi.number().optional().default(10),
});

// Add this to your existing validator
exports.getUserFavorites = joi.object().keys({
        userId: joi.string().required(), // The user whose favorites we want to get
        page: joi.number().integer().min(1).default(1),
        limit: joi.number().integer().min(1).max(100).default(20)
    })


