import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

import { notificationController } from "./notification.controller.js";

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

    // Find all users who match the category and subcategory (excluding the ask creator)
    const matchingUsers = await models.User.find({
        'business.category': businessCategory,
        // 'business.sub_category': businessSubCategory,
        _id: { $ne: userId }, // Exclude the ask creator
        fcm: { $exists: true, $ne: null } // Only users with FCM tokens
    }).select('_id fcm name');


    // Send notifications to all matching users
    for (const user of matchingUsers) {
        try {
            await notificationController.NotificationService.createNotification({
                userId: user._id,
                triggeredBy: userId,
                title: "New Ask Matching Your Business!",
                description: `A new ask has been posted in ${businessCategory} > ${businessSubCategory}`,
                relatedEntity: ask._id, // Add this
                entityType: 'ask', // Add this

                message: product,
               
            });
        } catch (error) {
            console.error(`Failed to send notification to user ${user._id}:`, error);
            // Continue with other users even if one fails
        }
    }

    return response.success("Ask created successfully!", { ask }, res);
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
    // const userSubCategories = user.business.map(b => b.sub_category);

    console.log("User Categories:", userCategories);

    let { page = 1, limit = 10 } = req.body;
    page = parseInt(page);
    limit = parseInt(limit);

    const asks = await models.Ask
        .find({
            isDeleted: false,
           
                 businessCategory: { $in: userCategories } ,
              
            
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
       
             businessCategory: { $in: userCategories },
       
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
const getMyAsks = asyncHandler(async (req, res) => {
    const { userId, page = 1, limit = 10, search = "" ,status} = req.body;

    if (!userId) {
        return response.error("provide valid userId", res);
    }

    const query = {
        userId,
        isDeleted: false
    };

    if (search && search.trim() !== ""){
        query.$or=[{product: { $regex: search.trim(), $options: "i" }},
            {status: { $regex: search.trim(), $options: "i" }},
            {description: { $regex: search.trim(), $options: "i" }},
            {businessCategory: { $regex: search.trim(), $options: "i" }},
            // {businessSubCategory: { $regex: search.trim(), $options: "i" }}
        ];
        
    }
    if (status) {
        query.status = status; // Exact match
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
            {
                path: 'leads.userId',
                select: 'name profilePic business',
                populate: {
                    path: 'business',
                    select: 'business_name business_type category sub_category'
                }
            }
        ],
        lean: true
    };

    // First get the paginated asks
    const result = await models.Ask.paginate(query, options);

    // For each ask, find matching users
    if (result.docs && result.docs.length > 0) {
        await Promise.all(result.docs.map(async (ask) => {
            // Find up to 3 users who match the category and subcategory
            const matchingUsers = await models.User.find({
                'business.category': ask.businessCategory,
                // 'business.sub_category': ask.businessSubCategory,
                _id: { $ne: ask.userId } 
            })
            .limit(3)
            .select('name profilePic mo').lean();

            ask.matchingUsers = matchingUsers || [];
            return ask;
        }));
    }

    return response.success("My asks fetched successfully!", result, res);
});


const askByAskId = asyncHandler(async (req, res) => {
    const { askId } = req.body;
    if (!askId) {
        return response.error("Ask ID is required", res);
    }
    const ask = await models.Ask.findById(askId).select('businessCategory businessSubCategory product description timeDuration status  createdAt')
    if( !ask || ask.isDeleted) {
        return response.success("Ask not found!", res);
    }
return response.success("Ask fetched successfully!", ask, res);
});

     // businessGiven.controller.js
const giveBusiness = asyncHandler(async (req, res) => {
    const { askId,userId, partnerId, amount, details } = req.body;
   // Assuming you have auth middleware

    // Validate input
    if (!askId || !partnerId || !amount) {
        return response.error("Missing required fields (askId, partnerId, amount)", 500,res);
    }

    // Check if amount is valid
    if (isNaN(amount) || amount <= 0) {
        return response.error("Amount must be a positive number",500, res);
    }

    try {
        // Find the ask
        const ask = await models.Ask.findOne({
            _id: askId,
            userId: userId,
            isDeleted: false
        });

        if (!ask) {
            return response.error("Ask not found or you don't have permission",500, res);
        }

        // Check if business was already given to this partner for this ask
        const alreadyGiven = ask.businessGiven.some(
            bg => bg.partnerId.toString() === partnerId.toString()
        );

        if (alreadyGiven) {
            return response.success("Business already given to this partner for this ask", false, res);
        }

        // Verify partner exists and belongs to the correct category
        const partner = await models.User.findOne({
            _id: partnerId,
            'business.category': ask.businessCategory,
            'business.sub_category': ask.businessSubCategory
        });

        if (!partner) {
            return response.error("Partner not found or doesn't match ask category", 500, res);
        }

        // Update the ask with business given
        const updatedAsk = await models.Ask.findByIdAndUpdate(
            askId,
            {
                $push: {
                    businessGiven: {
                        partnerId,
                        amount,
                        details
                    }
                },
                $set: { status: 'completed' } // Mark ask as completed
            },
            { new: true, runValidators: true }
        ).populate([
            {
                path: 'businessGiven.partnerId',
                select: 'name profilePic business',
                populate: {
                    path: 'business',
                    select: 'business_name business_type category sub_category'
                }
            },
            {
                path: 'userId',
                select: 'name profilePic'
            }
        ]);
        
       await notificationController.NotificationService.createNotification({
        userId:  partnerId,
        triggeredBy: userId,
       title: "New Business Given!",
                    description: `A new business has been given to you worth ₹${amount}`,
                    message: ask.product,
                    relatedEntity: {
                        type: 'Ask',
                        id: ask._id
                    }
                });

                return response.success("Business given successfully!", true, res);
           } catch (error) {
        console.error("Error giving business:", error);
        return response.error("Failed to give business",500, res);
    }
});

const deleteAsk = asyncHandler(async (req, res) => {
    

    const { userId, askId } = req.body;

    const ask = await models.Ask.findOneAndUpdate(
        { _id: askId, userId, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!ask) {
        return response.notFound("Ask not found or unauthorized!", res);
    }

    return response.success("Ask deleted successfully!", true, res);
});

const getMatchingPartners = asyncHandler(async (req, res) => {
    const { askId, page = 1, limit = 10 } = req.body;

    if (!askId) {
        return response.error("Please provide a valid askId", res);
    }

    // First find the ask to get category and subcategory
    const ask = await models.Ask.findOne({
        _id: askId,
        isDeleted: false
    }).lean();

    if (!ask) {
        return response.error("Ask not found or has been deleted", res);
    }

    // Query for matching partners
    const query = {
        'business.category': ask.businessCategory,
        // 'business.sub_category': ask.businessSubCategory,
        _id: { $ne: ask.userId } // Exclude the ask creator
    };

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        select: 'name profilePic business chapter_name city state mobile_number',
        populate: {
            path: 'business',
            select: 'business_name business_type category  about_business_details '
        },
        lean: true
    };

    const result = await models.User.paginate(query, options);

    return response.success("Matching partners fetched successfully!", result, res);
});

const getMyLeads = asyncHandler(async (req, res) => {
    const { userId, page = 1, limit = 10, status } = req.body;
   
    if (!userId) {
        return response.error("Please provide a valid userId", res);
    }

    // Get user's business categories
    const user = await models.User.findById(userId)
        .select('business')
        .lean();

    if (!user || !user.business || user.business.length === 0) {
        return response.success("User has no business profile", { docs: [], total: 0 }, res);
    }

    // Extract all unique category combinations
    const userCategories = user.business
        .filter(biz => biz.category)
        .map(biz => ({
            businessCategory: biz.category.trim(),
            // businessSubCategory: biz.sub_category.trim()
        }));

    if (userCategories.length === 0) {
        return response.success("No valid business categories found", { docs: [], total: 0 }, res);
    }

    // Build base query
    const query = {
        $or: userCategories,
        userId: { $ne: userId },
        isDeleted: false
    };

    // STRICT status filtering - only add if provided
    if (status) {
        query.status = status; // Exact match
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
            {
                path: 'userId',
                select: 'name profilePic chapter_name'
            },
            {
                path: 'leads.userId',
                select: 'name profilePic'
            }
        ],
        lean: true
    };

    // DEBUG: Log the final query
    console.log('Final query:', JSON.stringify(query, null, 2));

    const result = await models.Ask.paginate(query, options);
    
    return response.success("Leads fetched successfully!", result, res);
});
const getAllAsksForAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = "", chapter_name } = req.body;
  
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
  
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return response.error("Invalid page or limit", 400, res);
    }
  
    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $lookup: {
          from: "businesses",
          localField: "user.business",
          foreignField: "_id",
          as: "userBusiness"
        }
      },
      {
        $unwind: {
          path: "$userBusiness",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$businessGiven",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "businessGiven.partnerId",
          foreignField: "_id",
          as: "businessGiven.partner"
        }
      },
      {
        $unwind: {
          path: "$businessGiven.partner",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          "businessGiven.partnerDetails": {
            _id: "$businessGiven.partner._id",
            name: "$businessGiven.partner.name",
            chapter_name: "$businessGiven.partner.chapter_name",
            mobile_number: "$businessGiven.partner.mobile_number"
          }
        }
      },
      {
        $group: {
          _id: "$_id",
          product: { $first: "$product" },
          businessCategory: { $first: "$businessCategory" },
          businessSubCategory: { $first: "$businessSubCategory" },
          description: { $first: "$description" },
          timeDuration: { $first: "$timeDuration" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          user: { $first: "$user" },
          userBusiness: { $first: "$userBusiness" },
          leads: { $first: "$leads" },
          businessGiven: {
            $push: {
              partnerId: "$businessGiven.partnerId",
              amount: "$businessGiven.amount",
              givenAt: "$businessGiven.givenAt",
              details: "$businessGiven.details",
              partnerDetails: "$businessGiven.partnerDetails"
            }
          }
        }
      },
      {
        $project: {
          product: 1,
          businessCategory: 1,
          businessSubCategory: 1,
          description: 1,
          timeDuration: 1,
          status: 1,
          createdAt: 1,
          "user._id": 1,
          "user.name": 1,
          "user.email": 1,
          "user.mobile_number": 1,
          "user.profilePic": 1,
          "user.chapter_name": 1,
          "userBusiness.business_name": 1,
          "userBusiness.business_type": 1,
          "userBusiness.category": 1,
          "userBusiness.sub_category": 1,
          leads: 1,
          businessGiven: {
            $cond: {
              if: { $eq: ["$businessGiven", [{ partnerId: null }]] },
              then: [],
              else: "$businessGiven"
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];
  
    // Apply search filter on product
    if (search && typeof search === "string") {
      pipeline[0].$match.product = { $regex: search.trim(), $options: "i" };
    }
  
    // Apply chapter_name filter
    if (chapter_name && typeof chapter_name === "string") {
      pipeline.splice(3, 0, {
        $match: {
          "user.chapter_name": chapter_name
        }
      });
    }
  
    try {
      const result = await models.Ask.aggregatePaginate(
        models.Ask.aggregate(pipeline),
        { page: pageNum, limit: limitNum }
      );
  
      return response.success("All asks fetched successfully for admin!", result, res);
    } catch (err) {
      console.error("Ask aggregation error:", err.message);
      return response.error("Failed to fetch asks", 500, res);
    }
  });
  

const leadByLeadId = asyncHandler(async (req, res) => {
    const { askId } = req.body;
    if (!askId) {
        return response.error("Ask ID is required", res);
    }
    const ask = await models.Ask.findById(askId).select('businessCategory businessSubCategory product description timeDuration status  createdAt').populate({path: 'userId', select: 'name profilePic chapter_name mobile_number'}).lean();
    if( !ask || ask.isDeleted) {
        return response.success("Ask not found!", res);
    }
return response.success("Ask fetched successfully!", ask, res);
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
    askByAskId,
    giveBusiness,
    leadByLeadId,
    getAllAsksForAdmin,

    getMatchingPartners
};