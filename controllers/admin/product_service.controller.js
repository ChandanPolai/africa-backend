import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

const createProductService = asyncHandler(async (req, res) => {
    const { name, sub_category_name, status } = req.body;

    const trimmedName = name.trim();

    // Check for existing ProductService with same name under the same category (case-insensitive)
    const existingProductService = await models.ProductService.findOne({
        name: { $regex: `^${trimmedName}$`, $options: 'i' },
        sub_category_name: sub_category_name
    });
    if (existingProductService) {
        return response.conflict('ProductService with this name already exists in the selected SubCategory', res);
    }

    const newProductService = new models.ProductService({
        name: trimmedName,
        sub_category_name,
        status
    });

    await newProductService.save();

    return response.create('ProductService created successfully', newProductService, res);
});

const getProductServices = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const ProductServices = await models.ProductService.paginate(query, options);

    return response.success('SubCategor created successfully', ProductServices, res);
});

const getProductServiceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const ProductService = await models.ProductService.findById(id);

    if (!ProductService) {
        return response.success('ProductService not found', null, res);
    }
    return response.success('ProductService found', ProductService, res);
});

// Update SubCategory
const updateProductService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, sub_category_name, status } = req.body;

    const updatedProductService = await models.ProductService.findByIdAndUpdate(
        id,
        { name, sub_category_name, status },
        { new: true }
    );

    if (!updatedProductService) {
        return response.conflict('ProductService not found', null, res);
    }
    return response.success('ProductService updated successfully', updatedProductService, res);
});

const deleteProductService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedProductService = await models.ProductService.findByIdAndDelete(id);

    if (!deletedProductService) {
        return response.conflict('ProductService not found', null, res);
    }

    return response.success('ProductService deleted successfully', true, res);
});

// Export Controller
export const ProductServiceController = {
    createProductService,
    getProductServices,
    getProductServiceById,
    updateProductService,
    deleteProductService,
};