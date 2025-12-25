import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

// Get all suggestions for admin
export const getAllSuggestions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, category, search } = req.query;

    const query = { isActive: true };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { details: { $regex: search, $options: 'i' } }
        ];
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: {
            path: 'userId',
            select: 'name email mobile_number chapter_name profilePic'
        },
        sort: { createdAt: -1 }
    };

    const suggestions = await models.Suggestion.paginate(query, options);

    return response.success("Suggestions fetched successfully!", suggestions, res);
});

// Get suggestion by ID
export const getSuggestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const suggestion = await models.Suggestion.findById(id)
        .populate('userId', 'name email mobile_number chapter_name profilePic');
    
    if (!suggestion) {
        return response.error("Suggestion not found", 404, res);
    }

    return response.success("Suggestion fetched successfully!", { suggestion }, res);
});

// Update suggestion status
export const updateSuggestionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const suggestion = await models.Suggestion.findById(id);
    if (!suggestion) {
        return response.error("Suggestion not found", 404, res);
    }

    if (status) {
        suggestion.status = status;
    }
    if (adminResponse !== undefined) {
        suggestion.adminResponse = adminResponse;
    }

    await suggestion.save();

    return response.success("Suggestion status updated successfully!", { suggestion }, res);
});

// Delete suggestion
export const deleteSuggestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const suggestion = await models.Suggestion.findById(id);
    if (!suggestion) {
        return response.error("Suggestion not found", 404, res);
    }

    // Soft delete by setting isActive to false
    suggestion.isActive = false;
    await suggestion.save();

    return response.success("Suggestion deleted successfully!", true, res);
});

export const suggestionAdminController = {
    getAllSuggestions,
    getSuggestionById,
    updateSuggestionStatus,
    deleteSuggestion
};

