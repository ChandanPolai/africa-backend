
import { response } from '../../utils/response.js';
import { models } from '../../models/zindex.js';

const getActivePosts = async (req, res) => {
        const { type, page = 1, limit = 10 } = req.body;

        const body = { isDeleted: false };
        if (type) {
            body.type = type; 
        }

        const posts = await models.Post.find(body)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalPosts = await models.Post.countDocuments(body);

        return response.success("Active posts fetched successfully!", {
            posts,
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
            page: parseInt(page),
        }, res);
};

export const postController={
    getActivePosts
}