import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

// Create a new City
const createCity = asyncHandler(async (req, res) => {
    const { name, state_name, status } = req.body;
    const existingCountry = await models.City.findOne({ name: name });
    if (existingCountry) {
        return response.conflict('City already exist!!', res);
    }
    const newCity = await models.City.insertOne({ name, state_name, status });
    if (!newCity) {
        return response.serverError('Data not inserted', res);
    }
    return response.create('City created successfully', newCity, res);
});

// Get all cities with pagination and optional search
const getCities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const cities = await models.City.paginate(query, options);
    return response.success('City found successfully', cities, res);
});

// Get a single city by ID
const getCityById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const city = await models.City.findById(id);

    if (!city) {
        return response.success('City not found',null ,res);
    }

    return response.success('City found',city, res);
});

// Update a city by ID
const updateCity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, state_name, status } = req.body;

    const updatedCity = await models.City.findByIdAndUpdate(
        id,
        { name, state_name, status },
        { new: true }
    );

    if (!updatedCity) {
        return response.success('City not found',null ,res);
    }

     return response.success('City updated successfully',updatedCity, res);
});

// Delete a city by ID
const deleteCity = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedCity = await models.City.findByIdAndDelete(id);

    if (!deletedCity) {
        return response.success('City not found',null ,res);
    }

    return response.success('City deleted successfully',true, res);
});


export const cityController = {
    createCity,
    getCities,
    getCityById,
    updateCity,
    deleteCity,
};
