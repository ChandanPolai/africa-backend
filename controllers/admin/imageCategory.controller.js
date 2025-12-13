import { models } from "../../models/zindex.js";
import asyncHandler from "express-async-handler";
import { response } from "../../utils/response.js";

const createImageCategory = asyncHandler(async (req, res) => {
    const { name, status, links } = req.body;

    // Check for duplicate category name
    const existingCategory = await models.ImageCategory.findOne({ name: name.trim() });
    if (existingCategory) {
        return response.conflict('Category with this name already exists', res);
    }

    // Parse links if it's a string
    let linksArray = [];
    if (links) {
        if (typeof links === 'string') {
            try {
                linksArray = JSON.parse(links);
            } catch (e) {
                linksArray = [];
            }
        } else if (Array.isArray(links)) {
            linksArray = links;
        }
    }

    const newCategory = new models.ImageCategory({
        name: name.trim(),
        links: linksArray,
        status: status !== undefined ? status : true,
    });

    await newCategory.save();
    return response.create('Category created successfully', newCategory, res);
});

const getImageCategories = asyncHandler(async (req, res) => {
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

    const categories = await models.ImageCategory.paginate(query, options);
    return response.success('Categories Found', categories, res);
});

const getImageCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await models.ImageCategory.findById(id);

    if (!category) {
        return response.success('Category not found', null, res);
    }
    
    return response.success('Category Found', category, res);
});

const updateImageCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, status, links } = req.body;

    const category = await models.ImageCategory.findById(id);
    if (!category) {
        return response.success('Category not found', null, res);
    }

    // Parse links if it's a string
    let linksArray = category.links;
    if (links !== undefined) {
        if (typeof links === 'string') {
            try {
                linksArray = JSON.parse(links);
            } catch (e) {
                linksArray = category.links;
            }
        } else if (Array.isArray(links)) {
            linksArray = links;
        }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status;
    if (linksArray) updateData.links = linksArray;

    const updatedCategory = await models.ImageCategory.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    return response.success('Category updated successfully', updatedCategory, res);
});

const deleteImageCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedCategory = await models.ImageCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
        return response.success('Category not found', null, res);
    }

    return response.success('Category deleted successfully', true, res);
});

// Add link to category
const addLinkToCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { url } = req.body;

    if (!url) {
        return response.badRequest('URL is required', res);
    }

    const category = await models.ImageCategory.findById(id);
    if (!category) {
        return response.success('Category not found', null, res);
    }

    category.links.push({ url });
    await category.save();

    return response.success('Link added successfully', category, res);
});

// Update link in category
const updateLinkInCategory = asyncHandler(async (req, res) => {
    const { id, linkId } = req.params;
    const { url } = req.body;

    if (!url) {
        return response.badRequest('URL is required', res);
    }

    const category = await models.ImageCategory.findById(id);
    if (!category) {
        return response.success('Category not found', null, res);
    }

    const link = category.links.id(linkId);
    if (!link) {
        return response.success('Link not found', null, res);
    }

    link.url = url;
    await category.save();

    return response.success('Link updated successfully', category, res);
});

// Delete link from category
const deleteLinkFromCategory = asyncHandler(async (req, res) => {
    const { id, linkId } = req.params;

    const category = await models.ImageCategory.findById(id);
    if (!category) {
        return response.success('Category not found', null, res);
    }

    category.links.pull(linkId);
    await category.save();

    return response.success('Link deleted successfully', category, res);
});

export const imageCategoryController = {
    createImageCategory,
    getImageCategories,
    getImageCategoryById,
    updateImageCategory,
    deleteImageCategory,
    addLinkToCategory,
    updateLinkInCategory,
    deleteLinkFromCategory,
};

