import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const createSuggestion = asyncHandler(async (req, res) => {
    const { userId, title, details, category } = req.body;

    const suggestion = await models.Suggestion.create({
        userId,
        title,
        details,
        category

    });

    return response.success("Suggestion created successfully!", { suggestion }, res);
});

const getSuggestions = asyncHandler(async (req, res) => {
    const { userId, status, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: {
            path: 'userId', // This matches your schema field name
            select: 'name email phone chapter_name'
          },
        sort: { createdAt: -1 },

    };

    const suggestions = await models.Suggestion.paginate(query, options);

    return response.success("Suggestions fetched successfully!", suggestions, res);
});

const updateSuggestionStatus = asyncHandler(async (req, res) => {
    const { suggestionId } = req.params;
    const { status, adminResponse } = req.body;

    const suggestion = await models.Suggestion.findById(suggestionId);
    if (!suggestion) {
        return response.error("Suggestion not found", 404, res);
    }

    suggestion.status = status;
    if (adminResponse) suggestion.adminResponse = adminResponse;

    await suggestion.save();

    return response.success("Suggestion status updated successfully!", { suggestion }, res);
});


const getSuggestionsBySuggestionId = asyncHandler(async (req, res) => {
    const { suggestionId } = req.params;

    const suggestion = await models.Suggestion.findById(suggestionId).populate({ path: 'userId', select: 'name email phone chapter_name' });
    if (!suggestion) {
        return response.error("Suggestion not found", 404, res);
    }
    return response.success("Suggestion fetched successfully!", { suggestion }, res);
});
export const suggestionController = {
    createSuggestion,
    getSuggestions,
    getSuggestionsBySuggestionId,
    updateSuggestionStatus
};