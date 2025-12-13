import Joi from 'joi';

const createPost = Joi.object().keys({
    type: Joi.string().valid('news', 'event', 'announcement').required(),
    title: Joi.string().required(),
    //userId: Joi.string().required(),
    
    description: Joi.string().required(),
    startDate: Joi.when('type', {
        is: 'event',
        then: Joi.date().required(),
        otherwise: Joi.forbidden(),
    }),
    endDate: Joi.when('type', {
        is: 'event',
        then: Joi.date().required(),
        otherwise: Joi.forbidden(),
    }),
    location: Joi.when('type', {
        is: 'event',
        then: Joi.string().required(),
        otherwise: Joi.forbidden(),
    }),
    startTime: Joi.when('type', {
        is: 'event',
        then: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).trim().optional(),
        otherwise: Joi.forbidden(),
    }),
    endTime: Joi.when('type', {
        is: 'event',
        then: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).trim().optional(),
        otherwise: Joi.forbidden(),
    }),
    mapUrl: Joi.when('type', {
        is: 'event',
        then: Joi.string().uri().required(),
        otherwise: Joi.forbidden(),
    }),
    venue: Joi.when('type',  {
               is: 'event', 
               then: Joi.string().required(),
                otherwise: Joi.forbidden(),
    }),
});

const updatePost = Joi.object().keys({
    postId: Joi.string().required(),
    type: Joi.string().valid('news', 'event', 'announcement').required(),
    isDeleted: Joi.boolean().optional(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    startDate: Joi.when('type', {
        is: 'event',
        then: Joi.date().optional(),
        otherwise: Joi.forbidden(),
    }),
    endDate: Joi.when('type', {
        is: 'event',
        then: Joi.date().optional(),
        otherwise: Joi.forbidden(),
    }),
    location: Joi.when('type', {
        is: 'event',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden(),
    }),

    venue: Joi.when('type', {
        is: 'event',
        then: Joi.string().optional(),
        otherwise: Joi.forbidden(),
    }),
    startTime: Joi.when('type', {
        is: 'event',
        then: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).trim().optional(),
        otherwise: Joi.forbidden(),
    }),
    endTime: Joi.when('type', {
        is: 'event',
        then: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).trim().optional(),
        otherwise: Joi.forbidden(),
    }),
    mapUrl: Joi.when('type', {
        is: 'event',
        then: Joi.string().uri().optional(),
        otherwise: Joi.forbidden(),
    }),
});

const deletePost = Joi.object().keys({
    postId: Joi.string().required(),
});

export const postValidator={
    createPost,
    updatePost,
    deletePost
}