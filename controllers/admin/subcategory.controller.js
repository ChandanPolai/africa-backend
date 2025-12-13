import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

const createSubCategory = asyncHandler(async (req, res) => {
    const { name, category_name, status } = req.body;

    const trimmedName = name.trim();

    // Check for existing subcategory with same name under the same category (case-insensitive)
    const existingSubCategory = await models.SubCategory.findOne({
        name: { $regex: `^${trimmedName}$`, $options: 'i' },
        category_name: category_name
    });
    if (existingSubCategory) {
        return response.conflict('SubCategory with this name already exists in the selected category', res);
    }

    const newSubCategory = new models.SubCategory({
        name: trimmedName,
        category_name,
        status
    });

    await newSubCategory.save();

    return response.create('SubCategory created successfully', newSubCategory, res);
});

const getSubCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const SubCategories = await models.SubCategory.paginate(query, options);

    return response.success('SubCategor created successfully', SubCategories, res);
});

const getSubCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const SubCategory = await models.SubCategory.findById(id);

    if (!SubCategory) {
        return response.success('SubCategory not found',null ,res);
    }
    return response.success('SubCategory found',SubCategory, res);
});

// Update SubCategory
const updateSubCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, category_name, status } = req.body;

    const updatedSubCategory = await models.SubCategory.findByIdAndUpdate(
        id,
        { name, category_name, status },
        { new: true }
    );

    if (!updatedSubCategory) {
       return response.conflict('SubCategory not found',null ,res);
    }
     return response.success('SubCategory updated successfully',updatedSubCategory, res);
});

const deleteSubCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedSubCategory = await models.SubCategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {  
        return response.conflict('SubCategory not found',null ,res);
    }

    return response.success('SubCategory deleted successfully',true, res);
});

// Export Controller
export const SubCategoryController = {
    createSubCategory,
    getSubCategories,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
};
