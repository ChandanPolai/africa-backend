
import asyncHandler from 'express-async-handler';
import { response } from '../../utils/response.js';
import { models } from '../../models/zindex.js';

const createPost = asyncHandler(async (req, res) => {
        const { type, title, description, startDate, endDate, location, mapUrl, venue, startTime, endTime } = req.body;

        let image = "";
        if (req.file) {
            image = req.file.path.replace(/\\/g, '/');
        }


        const post = await models.Post.create({
            type,
            title,
            description,
            image,
            venue: type === 'event' ? venue : "",

            startDate: type === 'event' ? startDate : "",
            endDate: type === 'event' ? endDate : "",
            location: type === 'event' ? location : "",
            mapUrl: type === 'event' ? mapUrl : "",
            startTime: type === 'event' ? startTime : "",
            endTime: type === 'event' ? endTime : "",
        });

        return response.create("Post created successfully!", { post }, res);
})

// module.const postUploader = postUploader;

const updatePost = asyncHandler(async (req, res) => {
        const { postId, type, title, description, startDate, endDate, startTime, endTime, venue, location, mapUrl } = req.body;

        // Create update object
        const updateData = {
            type,
            title,
            description,
            startDate: type === 'event' ? startDate : null,
            endDate: type === 'event' ? endDate : null,
            location: type === 'event' ? location : "",
            mapUrl: type === 'event' ? mapUrl : "",
            venue: type === 'event' ? venue : "",
            startTime: type === 'event' ? startTime : "",
            endTime: type === 'event' ? endTime : "",
        };

        // Only add image to updateData if a file was uploaded
        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, '/');
        }

        // Update the post
        const post = await models.Post.findOneAndUpdate(
            { _id: postId },
            updateData,
            { new: true }
        );

        if (!post) {
            return response.success("Post not found or unauthorized!",null, res);
        }

        return response.success("Post updated successfully!", { post }, res);
})

const deletePost = asyncHandler(async (req, res) => {
        const { postId } = req.body;
        const post = await models.Post.findOneAndDelete(
            postId,

            { new: true }
        );

        if (!post) {
            return response.success("Post not found or unauthorized!",null, res);
        }

        return response.success("Post deleted successfully!", true, res);
})

const togglePostStatus =asyncHandler( async (req, res) => {
        const { postId } = req.body;
        const post = await models.Post.findById(postId);

        if (!post) {
            return response.success("Post not found!", null, res);
        }

        // Toggle the isDeleted status
        const updatedPost = await models.Post.findByIdAndUpdate(
            postId,
            { isDeleted: !post.isDeleted },
            { new: true }
        );

        return response.success(
            `Post ${updatedPost.isDeleted ? 'deActive' : 'active'} successfully!`,
            { post: updatedPost },
            res
        );
})

const getAllPosts =asyncHandler( async (req, res) => {
        const { type } = req.body;
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;


        const query = {};
        if (type) {
            query.type = type;
        }

        const options = {
            page,
            limit,
            sort: { createdAt: -1 }
        };

        const posts = await models.Post.paginate(query, options);

        if (!posts.docs || posts.docs.length === 0) {
            return response.error('No posts found', res);
        }

        return response.success("Posts fetched successfully", posts, res);
})

export const postController = {
    createPost,
    updatePost,
    deletePost,
    togglePostStatus,
    getAllPosts
}