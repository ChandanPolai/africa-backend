import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const createFeedback = asyncHandler(async (req, res) => {
    const { userId, eventId, title, details, category } = req.body;

    const feedback = await models.Feedback.create({
        userId,
        eventId,
        title,
        details,
        category
    });

    return response.success("Feedback created successfully!", { feedback }, res);
});

const getFeedbacks = asyncHandler(async (req, res) => {
    const { userId, eventId, status, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };
    if (userId) query.userId = userId;
    if (eventId) query.eventId = eventId;
    if (status) query.status = status;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            {
                path: 'userId',
                select: 'name email phone chapter_name'
            },
            {
                path: 'eventId',
                select: 'name event_or_meeting date mode chapter_name location details'
            },
        ],
        sort: { createdAt: -1 },
    };

    const feedbacks = await models.Feedback.paginate(query, options);

    return response.success("Feedbacks fetched successfully!", feedbacks, res);
});

const updateFeedbackStatus = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { status, adminResponse } = req.body;

    console.log("updateFeedbackStatus params: ", req.params, status, adminResponse)

    const feedback = await models.Feedback.findById(feedbackId);
    if (!feedback) {
        return response.error("Feedback not found", 404, res);
    }

    feedback.status = status;
    if (adminResponse) feedback.adminResponse = adminResponse;

    await feedback.save();

    return response.success("Feedback status updated successfully!", { feedback }, res);
});


const getFeedbacksByFeedbackId = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await models.Feedback.findById(feedbackId).populate(
        [
            {
                path: 'userId',
                select: 'name email phone chapter_name'
            },
            {
                path: 'eventId',
                select: 'name event_or_meeting date mode chapter_name location details'
            },
        ]
    );
    if (!feedback) {
        return response.error("Feedback not found", 404, res);
    }
    return response.success("Feedback fetched successfully!", { feedback }, res);
});
export const feedbackController = {
    createFeedback,
    getFeedbacks,
    getFeedbacksByFeedbackId,
    updateFeedbackStatus
};