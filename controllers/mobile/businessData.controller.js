import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';

const getAllBusinessHierarchy = asyncHandler(async (req, res) => {
    const categories = await models.Category.find({ status: true });

    const result = await Promise.all(
        categories.map(async (category) => {
            const subCategories = await models.SubCategory.find({
                category_name: category.name,
                status: true
            });

            const enrichedSubCategories = await Promise.all(
                subCategories.map(async (sub) => {
                    const productServices = await models.ProductService.find({
                        sub_category_name: sub.name,
                        status: true
                    });

                    return {
                        name: sub.name,
                        productServices: productServices.map(product => ({
                            name: product.name
                        }))
                    };
                })
            );

            return {
                name: category.name,
                subCategories: enrichedSubCategories
            };
        })
    );

    return res.status(200).json({ success: true, data: result });
});


export const businessDataController = {
    getAllBusinessHierarchy
};