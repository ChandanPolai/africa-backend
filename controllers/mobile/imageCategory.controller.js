import { models } from "../../models/zindex.js";
import asyncHandler from "express-async-handler";
import { response } from "../../utils/response.js";

const getImageCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    let query = { status: true }; // Only active categories
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const categories = await models.ImageCategory.paginate(query, options);
    return response.success('Categories Found', categories, res);
});

const getImageCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await models.ImageCategory.findOne({ 
        _id: id, 
        status: true 
    });

    if (!category) {
        return response.success('Category not found', null, res);
    }
    
    return response.success('Category Found', category, res);
});

export const mobileImageCategoryController = {
    getImageCategories,
    getImageCategoryById,
};

