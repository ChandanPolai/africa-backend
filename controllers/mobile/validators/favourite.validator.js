import Joi from 'joi';
import path from 'path';
const addToFavorites = Joi.object().keys({
    favoriteUserId: Joi.string().required(),
});

const removeFromFavorites = Joi.object().keys({
    favoriteUserId: Joi.string().required(),
})

const getFavorites = Joi.object().keys({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10),
});

const getUserFavourites = Joi.object().keys({
    userId: Joi.string().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
})

export const favouriteValidator={
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    getUserFavourites
}