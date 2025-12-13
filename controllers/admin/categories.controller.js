import { models } from "../../models/zindex.js";
import asyncHandler from "express-async-handler";
import { response } from "../../utils/response.js";
const createCategory = asyncHandler(async (req, res) => {
    const { name, status } = req.body;

    // Check for duplicate category name
    const existingCategory = await models.Category.findOne({ name: name.trim() });
    if (existingCategory) {
        return response.conflict('Category with this name already exists', res);
    }

    const newCategory = new models.Category({
        name: name.trim(),
        status,
    });

    await newCategory.save();
    return response.create('Category created successfully', newCategory, res);
});

const getCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    let query = {};
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const categories = await models.Category.paginate(query, options);
    return response.success('Category Found', categories, res);
})

// Get a single category by ID
const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await models.Category.findById(id);

    if (!category) {
        return response.success('Category not found',null ,res);
    }
    
    return response.success('Category Found', category, res);
})

const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;

    const updatedCategory = await models.Category.findByIdAndUpdate(
        id,
        { name, status },
        { new: true }
    );

    if (!updatedCategory) {
        return response.success('Category not found',null ,res);
    }

    return response.success('Category updated successfully',updatedCategory, res);
})

const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedCategory = await models.Category.findByIdAndDelete(id);

    if (!deletedCategory) {
        return response.success('Category not found',null ,res);
    }
    return response.success('Category deleted successfully',true, res);
});


export const categoryController = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};