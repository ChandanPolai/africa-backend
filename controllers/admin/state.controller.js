import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
// Create a new state
const createState = asyncHandler(async (req, res) => {
    const { name, country_name, status } = req.body;
    const existingCountry = await models.State.findOne({ name: name });
    if (existingCountry) {
        return response.conflict("State already exists",  res);
    }
    const newState = await models.State.insertOne({ name, country_name, status });
    if (!newState) {
        return response.serverError("Something went wrong while creating the state", res);
    }
    return response.success("State created successfully",  newState,res);
})

const getAllStates = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {};
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const states = await models.State.paginate(query, options);

    return response.success("States fetched successfully",states ,res);
})

const getStateById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const state = await models.State.findById(id);
    if (!state) {
       return response.success("State not found", null, res);
    }

    return response.success("State fetched successfully", state, res);
})

// Update a state
const updateState = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, country_name, status } = req.body;

    const state = await models.State.findByIdAndUpdate(
        id,
        { name, country_name, status },
        { new: true, runValidators: true }
    );

    if (!state) {
        return response.success("State not found", null, res);
    }

    return response.success("State updated successfully", state, res);

})

// Delete a state
const deleteState = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const state = await models.State.findByIdAndDelete(id);

    if (!state) {
       return response.success("State not found", null, res);
    }

    return response.success("State deleted successfully", true, res);
});

export const stateController = {
    createState,
    getAllStates,
    getStateById,
    updateState,
    deleteState,
};
