const joi = require('joi');

exports.createFeed = joi.object().keys({
     //userId: joi.string().required(), // User who is creating the feed
     description: joi.string().optional().allow(''),
     title:joi.string().required() // Feed description
     //images: joi.array().items(joi.string()).optional(), // Array of image URLs
 });
 
 exports.deleteFeed = joi.object().keys({
     //userId: joi.string().required(), // User who is deleting the feed
     feedId: joi.string().required(), // Feed ID to delete
 });
 
 exports.getFeeds = joi.object().keys({
     page: joi.number().optional().default(1), // Pagination page
     limit: joi.number().optional().default(10), // Pagination limit
 });
 
 exports.likeFeed = joi.object().keys({
     //userId: joi.string().required(), // User who is liking the feed
     feedId: joi.string().required(), // Feed ID to like
 });
 
 exports.unlikeFeed = joi.object().keys({
     //userId: joi.string().required(), // User who is unliking the feed
     feedId: joi.string().required(), // Feed ID to unlike
 });
 
 exports.addComment = joi.object().keys({
    // userId: joi.string().required(), // User who is adding the comment
     feedId: joi.string(), // Feed ID to comment on
     comment: joi.string().required(), // Comment text
 });
 
 exports.deleteComment = joi.object().keys({
     userId: joi.string().required(), // User who is deleting the comment
     commentId: joi.string().required(), // Comment ID to delete
 });
 
 exports.getFeedsByuserId = joi.object().keys({  
    // userId: joi.string().required(), 
     page:joi.string().required(),
     limit: joi.string().required(),
 });
 
 exports.getComments = joi.object().keys({
     feedId: joi.string().required(), 
     page:joi.number().optional().default(1),
     limit: joi.number().optional().default(10),
 });
 