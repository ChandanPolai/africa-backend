import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import moment from 'moment-timezone';

// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');

// Create a new fee plan (Admin only)
const createFeePlan = asyncHandler(async (req, res) => {
    const { name, description, amount, type, durationInMonths } = req.body;

    // Validate fee type
    const validTypes = ['monthly', 'quarterly', 'half-yearly', 'annually'];
    if (!validTypes.includes(type)) {
        return response.error("Invalid fee type. Must be one of: monthly, quarterly, half-yearly, annually", res);
    }

    const feePlan = await models.FeeMaster.create({
        name,
        description,
        amount,
        type,
        durationInMonths
    });

    return response.success("Fee plan created successfully!", feePlan, res);
});



// Update a fee plan (Admin only)
const updateFeePlan = asyncHandler(async (req, res) => {
    const { feePlanId } = req.params;
    const updateData = req.body;

    const feePlan = await models.FeeMaster.findByIdAndUpdate(
        feePlanId,
        updateData,
        { new: true, runValidators: true }
    );

    if (!feePlan) {
        return response.error("Fee plan not found", res);
    }

    return response.success("Fee plan updated successfully!", feePlan, res);
});

// Get all fee plans (Admin + Mobile)
const getAllFeePlans = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, isActive = true } = req.query;

    const query = { isActive };
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },

    };

    const result = await models.FeeMaster.paginate(query, options);

    return response.success("Fee plans fetched successfully!",
        result
        , res);
});

// Toggle fee plan status (Admin only)
const toggleFeePlanStatus = asyncHandler(async (req, res) => {
    const { feePlanId } = req.params;

    const feePlan = await models.FeeMaster.findById(feePlanId);
    if (!feePlan) {
        return response.error("Fee plan not found", res);
    }

    feePlan.isActive = !feePlan.isActive;
    await feePlan.save();

    return response.success(
        `Fee plan ${feePlan.isActive ? 'activated' : 'deactivated'} successfully!`,
        feePlan,
        res
    );
});

// Get all payments (Admin only)
const getAllPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, userId, feePlanId, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (feePlanId) query.feeMasterId = feePlanId;

    if (startDate && endDate) {
        query.paymentDate = {
            $gte: moment(startDate).startOf('day').toDate(),
            $lte: moment(endDate).endOf('day').toDate()
        };
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { paymentDate: -1 },
        populate: [
            { path: 'userId', select: 'name email mobile_number' },
            { path: 'feeMasterId', select: 'name type amount' }
        ],
        lean: true
    };

    const result = await models.paymentHistory.paginate(query, options);

    return response.success("Payments fetched successfully!", {
        result
    }, res);
});
export const feesController = {

    createFeePlan,
    updateFeePlan,
    getAllFeePlans,
    toggleFeePlanStatus,
    getAllPayments
};

