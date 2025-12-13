import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const createAsk = asyncHandler(async (req, res) => {
   

    const { userId, businessCategory, businessSubCategory, product, description, timeDuration } = req.body;

    const ask = await models.Ask.create({
        userId,
        businessCategory,
        businessSubCategory,
        product,
        description,
        timeDuration
    });

    return response.success("Ask created successfully!", { ask }, res);
});
const getMyAsks = asyncHandler(async (req, res) => {
    const { userId, page = 1, limit = 10, search = "" } = req.body;

    if (!userId) {
        return response.error("provide valid userId", res);
    }

    const query = {
        userId,
        isDeleted: false
    };

    // If a search term is provided, apply case-insensitive regex search on 'product'
    if (search && search.trim() !== "") {
        query.product = { $regex: search.trim(), $options: "i" };
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: {
            path: 'leads.userId',
            select: 'name profilePic business',
            populate: {
                path: 'business',
                select: 'business_name business_type category sub_category'
            }
        },
        lean: true
    };

    const result = await models.Ask.paginate(query, options);

    return response.success("My asks fetched successfully!", {
        result
    }, res);
});


const getAsksByCategory = asyncHandler(async (req, res) => {
    const {userId} = req.body;
    if (!userId) {
        return response.error("provide user Id", res);
    }

    // Get user's business categories
    const user = await models.User.findById(userId).select('business');
    if (!user || !user.business || user.business.length === 0) {
        return response.success("No asks found for your categories!", { asks: [] }, res);
    }

    const userCategories = user.business.map(b => b.category);
    const userSubCategories = user.business.map(b => b.sub_category);

    console.log("User Categories:", userCategories);

    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const asks = await models.Ask
        .find({
            isDeleted: false,
            $or: [
                { businessCategory: { $in: userCategories } },
                { businessSubCategory: { $in: userSubCategories } }
            ],
            userId: { $ne: userId } // Exclude user's own asks
        })
        .populate({
            path: 'userId',
            select: 'name profilePic business',
            populate: {
                path: 'business',
                select: 'business_name business_type category sub_category'
            }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalAsks = await models.Ask.countDocuments({
        isDeleted: false,
        $or: [
            { businessCategory: { $in: userCategories } },
            { businessSubCategory: { $in: userSubCategories } }
        ],
        userId: { $ne: userId }
    });
    const totalPages = Math.ceil(totalAsks / limit);

    return response.success("Asks fetched successfully!", { asks, totalPages }, res);
});

const addLeadToAsk = asyncHandler(async (req, res) => {

    
    const { userId,askId, price, details } = req.body;

    const ask = await models.Ask.findById(askId);
    if (!ask || ask.isDeleted) {
        return response.notFound("Ask not found!", res);
    }

  
    const existingLead = ask.leads.find(lead => lead.userId.toString() === userId);
    if (existingLead) {
        return response.conflict("You have already submitted a lead for this ask!", res);
    }

    ask.leads.push({
        userId,
        price,
        details
    });

    await ask.save();

    return response.success("Lead added successfully!", { ask }, res);
});



const updateAskStatus = asyncHandler(async (req, res) => {
    

    const { userId, askId, status } = req.body;

    if (!['pending', 'approved', 'completed'].includes(status)) {
        return response.badRequest("Invalid status value!", res);
    }

    const ask = await models.Ask.findOneAndUpdate(
        { _id: askId, userId, isDeleted: false },
        { status },
        { new: true }
    );

    if (!ask) {
        return response.notFound("Ask not found or unauthorized!", res);
    }

    return response.success("Ask status updated successfully!", { ask }, res);
});

const updateLeadStatus = asyncHandler(async (req, res) => {
   

    const {userId, askId, leadId, status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return response.badRequest("Invalid status value!", res);
    }

    const ask = await models.Ask.findOne({
        _id: askId,
        userId,
        isDeleted: false
    });

    if (!ask) {
        return response.notFound("Ask not found or unauthorized!", res);
    }

    const leadIndex = ask.leads.findIndex(lead => lead._id.toString() === leadId);
    if (leadIndex === -1) {
        return response.notFound("Lead not found!", res);
    }

    ask.leads[leadIndex].status = status;
    await ask.save();

    return response.success("Lead status updated successfully!", { ask }, res);
});
// const getMyLeads = asyncHandler(async (req, res) => {
//     // Log request body immediately
//     console.log('[getMyLeads] Request Body:', JSON.stringify(req.body, null, 2));

//     const { userId, page = 1, limit = 10, status } = req.body;

//     if (!userId) {
//         console.log('[getMyLeads] Error: Missing userId');
//         return response.error("Please provide a valid userId", res);
//     }

//     // Validate status
//     if (status && !['pending', 'completed'].includes(status.toLowerCase())) {
//         console.log('[getMyLeads] Error: Invalid status:', status);
//         return response.error("Invalid status. Must be 'pending' or 'completed'", res);
//     }

//     // Get user's business categories
//     try {
//         console.log('[getMyLeads] Fetching user with ID:', userId);
//         const user = await models.User.findById(userId)
//             .select('business')
//             .lean();

//         if (!user || !user.business || user.business.length === 0) {
//             console.log('[getMyLeads] No business profile found for user:', userId);
//             return response.success("User has no business profile", { docs: [], total: 0 }, res);
//         }

//         // Extract all unique category combinations
//         const userCategories = user.business
//             .filter(biz => biz.category && biz.sub_category)
//             .map(biz => ({
//                 businessCategory: biz.category.trim(),
//                 businessSubCategory: biz.sub_category.trim()
//             }));

//         console.log('[getMyLeads] User Categories:', JSON.stringify(userCategories, null, 2));

//         if (userCategories.length === 0) {
//             console.log('[getMyLeads] No valid business categories found');
//             return response.success("No valid business categories found", { docs: [], total: 0 }, res);
//         }

//         // Build query
//         const query = {
//             $or: userCategories,
//             userId: { $ne: userId },
//             isDeleted: false,
//         };

//         // Add status filter if provided
//         if (status) {
//             query.status = status.toLowerCase();
//         }

//         console.log('[getMyLeads] MongoDB Query:', JSON.stringify(query, null, 2));

//         const options = {
//             page: parseInt(page),
//             limit: parseInt(limit),
//             sort: { createdAt: -1 },
//             populate: {
//                 path: 'userId',
//                 select: 'name profilePic chapter_name'
//             },
//             lean: true
//         };

//         console.log('[getMyLeads] Query Options:', JSON.stringify(options, null, 2));

//         const result = await models.Ask.paginate(query, options);
//         console.log('[getMyLeads] Result Total Docs:', result.totalDocs);
//         console.log('[getMyLeads] Result Docs:', JSON.stringify(result.docs.map(doc => ({ _id: doc._id, status: doc.status })), null, 2));

//         return response.success("Leads fetched successfully!", result, res);
//     } catch (error) {
//         console.error('[getMyLeads] Error:', error.message, error.stack);
//         return response.error(`Error fetching leads: ${error.message}`, res);
//     }
// });
const getAllAsksForAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.body;

    const query = {
        isDeleted: false
    };

    // Apply search filter on product field
    if (search && search.trim() !== "") {
        query.product = { $regex: search.trim(), $options: "i" };
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
            {
                path: 'userId',
                select: 'name email mobile_number profilePic business',
                populate: {
                    path: 'business',
                    select: 'business_name business_type category sub_category'
                }
            },
            {
                path: 'leads.userId',
                select: 'name email profilePic business',
                populate: {
                    path: 'business',
                    select: 'business_name business_type category sub_category'
                }
            },
            {
                path: 'businessGiven.partnerId',
                select: 'name email profilePic business',
                populate: {
                    path: 'business',
                    select: 'business_name business_type category sub_category'
                }
            }
        ],
        lean: true
    };

    const result = await models.Ask.paginate(query, options);

    return response.success("All asks fetched successfully for admin!", { result }, res);
});

export const askController = {
    createAsk,
    getMyAsks,
    getAsksByCategory,
    addLeadToAsk,
    getMyLeads,
    updateAskStatus,
    updateLeadStatus,
    deleteAsk,
    getAllAsksForAdmin 
};