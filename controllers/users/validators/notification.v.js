let Joi = require('joi');

exports.updateNotificationPreferences= Joi.object({
   // userId:Joi.string().required(),
    preferences: Joi.object({
        newFollowers: Joi.boolean(),
        profileFavorites: Joi.boolean(),
        newFeedFromFollowers: Joi.boolean(),
        postInteractions: Joi.boolean(),
        profileView: Joi.boolean(),
        receiveUpdatesAndOffers: Joi.boolean()
    }).required()
})

exports.getNotifications= Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
})

