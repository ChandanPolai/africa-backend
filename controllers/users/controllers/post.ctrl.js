const encryptor = require('./../../../core/encryptor');
const models = require('./../../../models/zindex');
const response = require('./../../../core/response');
const helper = require('./../../../core/helper');
const validator = require('./../validators/authentication.v');
const verifyToken = require('./../../../middleware/authentication');
const { uploader } = require('./../../../middleware/files');
const fs = require('fs');
exports.getActivePosts = async (req, res) => {
    try {
        const { type, page = 1, limit = 10 } = req.body;

        const body = { isDeleted: false };
        if (type) {
            body.type = type; 
        }

        const posts = await models.posts.find(body)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalPosts = await models.posts.countDocuments(body);

        return response.success("Active posts fetched successfully!", {
            posts,
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
            page: parseInt(page),
        }, res);
    } catch (err) {
        console.error("Error in getActivePosts:", err);
        return response.error(err, res);
    }
};