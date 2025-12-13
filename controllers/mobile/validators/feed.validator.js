import joi from "joi";
const createFeed = joi.object().keys({
    description: joi.string().optional().allow(''),
    title: joi.string().required()
});

const deleteFeed = joi.object().keys({
    feedId: joi.string().required(),
});
const saveFeed = joi.object().keys({
    feedId: joi.string().required().messages({
        'string.empty': 'Feed ID is required',
        'any.required': 'Feed ID is required'
    })
})

const getFeeds = joi.object().keys({
    page: joi.number().optional().default(1),
    limit: joi.number().optional().default(10),
});

const likeFeed = joi.object().keys({
    feedId: joi.string().required(),
});

const unlikeFeed = joi.object().keys({
    feedId: joi.string().required(),
});

const addComment = joi.object().keys({
    feedId: joi.string(),
    comment: joi.string().required(),
})

const deleteComment = joi.object().keys({
    userId: joi.string().required(),
    commentId: joi.string().required(),
});

const getFeedsByuserId = joi.object().keys({
    page: joi.string().required(),
    limit: joi.string().required(),
});

const getComments = joi.object().keys({
    feedId: joi.string().required(),
    page: joi.number().optional().default(1),
    limit: joi.number().optional().default(10),
});

export const feedValidator={
    createFeed,
    deleteFeed,
    saveFeed,
    getFeeds,
    likeFeed,
    unlikeFeed,
    addComment,
    deleteComment,
    getFeedsByuserId,
    getComments
}