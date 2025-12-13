    import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const giveBusiness = asyncHandler(async (req, res) => {
   

    const { 
        userId,
        receiverUserId, 
        partnerName, 
        chapterName, 
        amount, 
        businessCategory, 
        businessSubCategory, 
        askId,
        notes 
    } = req.body;

    // Validate receiver exists
    const receiver = await models.User.findById(receiverUserId);
    if (!receiver) {
        return response.notFound("Receiver user not found!", res);
    }

    // If askId is provided, validate the ask exists
    if (askId) {
        const ask = await models.Ask.findById(askId);
        if (!ask) {
            return response.notFound("Ask not found!", res);
        }
    }

    const businessGiven = await models.BusinessGiven.create({
        giverUserId: userId,
        receiverUserId,
        partnerName,
        chapterName,
        amount,
        businessCategory,
        businessSubCategory,
        askId,
        notes
    });

    return response.success("Business given recorded successfully!", { businessGiven }, res);
});

const getGivenBusiness = asyncHandler(async (req, res) => {
    const {userId} = req.body;
    if (!userId) {
        return response.error("provide user Id ", res);
    }

    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const givenBusiness = await models.BusinessGiven
        .find({ giverUserId: userId, isDeleted: false })
        .populate({
            path: 'receiverUserId',
            select: 'name profilePic business',
            populate: {
                path: 'business',
                select: 'business_name business_type category sub_category'
            }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalGiven = await models.BusinessGiven.countDocuments({ 
        giverUserId: userId, 
        isDeleted: false 
    });
    const totalPages = Math.ceil(totalGiven / limit);

    return response.success("Given business fetched successfully!", { 
        givenBusiness, 
        totalPages 
    }, res);
});

const getReceivedBusiness = asyncHandler(async (req, res) => {
    const {userId} = req.body;
    if (!userId) {
        return response.error("provide userId", res);
    }

    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const receivedBusiness = await models.BusinessGiven
        .find({ receiverUserId: userId, isDeleted: false })
        .populate({
            path: 'giverUserId',
            select: 'name profilePic business',
            populate: {
                path: 'business',
                select: 'business_name business_type category sub_category'
            }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalReceived = await models.BusinessGiven.countDocuments({ 
        receiverUserId: userId, 
        isDeleted: false 
    });
    const totalPages = Math.ceil(totalReceived / limit);

    return response.success("Received business fetched successfully!", { 
        receivedBusiness, 
        totalPages 
    }, res);
});

const updateBusinessGivenStatus = asyncHandler(async (req, res) => {
  

    const { userId, businessGivenId, status } = req.body;

    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
        return response.badRequest("Invalid status value!", res);
    }

    const businessGiven = await models.BusinessGiven.findOneAndUpdate(
        { 
            _id: businessGivenId, 
            receiverUserId: userId, // Only receiver can update status
            isDeleted: false 
        },
        { status },
        { new: true }
    );

    if (!businessGiven) {
        return response.notFound("Business given record not found or unauthorized!", res);
    }

    return response.success("Business given status updated successfully!", { businessGiven }, res);
});

const deleteBusinessGiven = asyncHandler(async (req, res) => {
 

    const { userId, businessGivenId } = req.body;

    // Only allow deletion by the giver
    const businessGiven = await models.BusinessGiven.findOneAndUpdate(
        { 
            _id: businessGivenId, 
            giverUserId: userId, 
            isDeleted: false 
        },
        { isDeleted: true },
        { new: true }
    );

    if (!businessGiven) {
        return response.notFound("Business given record not found or unauthorized!", res);
    }

    return response.success("Business given record deleted successfully!", true, res);
});

export const businessGivenController= {
    giveBusiness,
    getGivenBusiness,
    getReceivedBusiness,
    updateBusinessGivenStatus,
    deleteBusinessGiven
};