import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const createShareHistory = asyncHandler(async (req, res) => {
    const { userId, name, mobile_number } = req.body;

    const shareHistory = await models.ShareHistory.create({
        userId,
        name,
        mobile_number
    });

    return response.success("ShareHistory created successfully!", { shareHistory }, res);
});

const getShareHistorys = asyncHandler(async (req, res) => {
    const { userId, page = 1, limit = 10 } = req.params;

    const query = {};
    if (userId) query.userId = userId;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: [
            {
                path: 'userId',
                select: 'name email phone chapter_name'
            },
        ],
        sort: { createdAt: -1 },
    };

    const shareHistorys = await models.ShareHistory.paginate(query, options);

    return response.success("ShareHistorys fetched successfully!", shareHistorys, res);
});
export const shareHistoryController = {
    createShareHistory,
    getShareHistorys,
};