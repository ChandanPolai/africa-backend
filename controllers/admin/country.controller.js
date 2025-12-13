import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

const getAllCountries = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const countries = await models.Country.paginate(query, options);
    return response.success('Countries fetched successfully',countries, res);
});

// Create a new country
const createCountry = asyncHandler(async (req, res) => {
    const { name, status } = req.body;
    const existingCountry = await models.Country.findOne({ name: name });
    if (existingCountry) {
        return response.conflict('Country already exist!!', res);
    }
    const newCountry = await models.Country.insertOne({ name, status })
    if (!newCountry) {
        return response.serverError('Something went wront in Creating Country!!', res);
    }

    return response.create('Country created successfully',newCountry, res);
});

// Delete a country by ID
const deleteCountry = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const country = await models.Country.findByIdAndDelete(id);

    if (!country) {
        return response.success('Country not found',null, res);
    }

    return response.success('Country deleted successfully',true, res);
});

// Get a country by ID
const getCountryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const country = await models.Country.findById(id);
    if (!country) {
        return response.success('Country not found',null, res);
    }

     return response.success('Country fetched successfully', country, res);
});


const updateCountry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;

    const country = await models.Country.findByIdAndUpdate(
        id,
        { name, status },
        { new: true, runValidators: true }
    );

    if (!country) {
       return response.success('Country not found',null, res);
    }

    return response.success('Country updated successfully', country, res);
});

export const countryController = {
    getAllCountries,
    createCountry,
    deleteCountry,
    getCountryById,
    updateCountry,
};
