import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const createBadge = asyncHandler(async (req, res) => {
  const { name, description} = req.body;

  let image = '';
    if (req.file) {
    image = req.file.path.replace(/\\/g, '/');
    }


 



  const badge = await models.Badge.create({
    name,
    description: description || '',
    image: image || '',
   
   
  });

  response.success('Badge created successfully', { badge }, res);
  });



const updateBadge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

    

 

  const badge = await models.Badge.findById(id);
  if (!badge) {
    res.status(404);
    throw new Error('Badge not found');
  }

  // Check if new name is unique (if changed)
  if (name && name !== badge.name) {
    const badgeExists = await models.Badge.findOne({ name });
    if (badgeExists) {
      res.status(400);
      throw new Error('Badge name already exists');
    }
  }
  let image = badge.image;
  if (req.file) {
    image = req.file.path.replace(/\\/g, '/');
    }

  badge.name = name || badge.name;
  badge.description = description !== undefined ? description : badge.description;
  badge.image = image || badge.image;
  badge.updatedAt = new Date();

  await badge.save();

  res.status(200).json({
    success: true,
    message: 'Badge updated successfully',
    data: badge,
  });
});


const deleteBadge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const badge = await models.Badge.findById(id);
  if (!badge) {
    res.status(404);
    throw new Error('Badge not found');
  }

  // Remove badge from all users
  await models.User.updateMany(
    { 'badges.badgeId': id },
    { $pull: { badges: { badgeId: id } } }
  );

  await badge.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Badge deleted successfully',
  });
});


const getAllBadges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  const query = search ? { name: { $regex: search, $options: 'i' } } : {};

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
  
  };

  const badges = await models.Badge.paginate(query, options);

  res.status(200).json({
    success: true,
    message: 'Badges fetched successfully',
    data: badges,
  });
});


const assignBadge = asyncHandler(async (req, res) => {
  const { userId, badgeId } = req.body;

  console.log('Assigning badge:', req.body);
 

  // Validate inputs
  if (!userId || !badgeId) {
    res.status(400);
    throw new Error('User ID and Badge ID are required');
  }

  const user = await models.User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const badge = await models.Badge.findById(badgeId);
  if (!badge) {
    res.status(404);
    throw new Error('Badge not found');
  }

  // Check if badge is already assigned
  const badgeAssigned = user.badges.some(b => b.badgeId.toString() === badgeId);
  if (badgeAssigned) {
    res.status(200).json({
      success: false,
      message: 'Badge already assigned to user',
      data: true
    });
  }
  user.badges.push({
    badgeId,
    assignedAt: new Date(),
    
  });

  await user.save();

  // let updatedUser = await models.User.findById(userId).populate('badges.badgeId', 'name description image').select('badges');
  // if (!updatedUser) {
  //   res.status(404);
  //   throw new Error('User not found after assignment');
  // }
  

  res.status(200).json({
    success: true,
    message: 'Badge assigned successfully',
    data: true
  });
});


const unassignBadge = asyncHandler(async (req, res) => {
  const { userId, badgeId } = req.body;

  // Validate inputs
  if (!userId || !badgeId) {
    res.status(400);
    throw new Error('User ID and Badge ID are required');
  }

  const user = await models.User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const badge = await models.Badge.findById(badgeId);
  if (!badge) {
    res.status(404);
    throw new Error('Badge not found');
  }


  user.badges = user.badges.filter(b => b.badgeId.toString() !== badgeId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Badge unassigned successfully',
    data: true,
  });
});

const getUserBadges = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await models.User.findById(userId).populate('badges.badgeId', 'name description image');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'User badges fetched successfully',
    data: user.badges,
  });
});

// const getAllBadgesUsers = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, search = "", badge_name, chapter_name } = req.body;

//   // Validate pagination inputs
//   const pageNum = parseInt(page);
//   const limitNum = parseInt(limit);
//   if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
//     return response.error('Invalid page or limit', 400, res);
//   }

//   // Build match stage for aggregation
//   const matchStage = {
    
//     // Ensure user has at least one badge
//   };

//   if (chapter_name) {
//     matchStage.chapter_name = chapter_name;
//   }
//   if (search) {
//     matchStage.$or = [
//       { name: { $regex: search, $options: 'i' } },
//       { email: { $regex: search, $options: 'i' } },
//       { mobile_number: { $regex: search, $options: 'i' } },
//     ];
//   }

//   // Build aggregation pipeline
//   const pipeline = [
//     { $match: matchStage },
//     {
//       $lookup: {
//         from: 'badges', // Ensure this matches your Badge model's collection name
//         localField: 'badges.badgeId',
//         foreignField: '_id',
//         as: 'badgeDetails',
//       },
//     },
//   ];

//   // Add badge_name filter if provided
//   if (badge_name && typeof badge_name === 'string') {
//     pipeline.push({
//       $match: {
//         'badgeDetails.name': { $regex: badge_name, $options: 'i' }, // Case-insensitive badge name match
//       },
//     });
//   }

//   // Project required fields
//   pipeline.push({
//     $project: {
//       name: 1,
//       mobile_number: 1,
//       email: 1,
//       chapter_name: 1,
//       badges: {
//         $map: {
//           input: '$badges',
//           as: 'badge',
//           in: {
//             badgeId: '$$badge.badgeId',
//             assignedAt: '$$badge.assignedAt',
//             name: {
//               $arrayElemAt: [
//                 '$badgeDetails.name',
//                 { $indexOfArray: ['$badgeDetails._id', '$$badge.badgeId'] },
//               ],
//             },
//           },
//         },
//       },
//     },
//   });

//   // Sort by name
//   pipeline.push({ $sort: { name: 1 } });

//   try {
//     // Execute aggregation with pagination
//     const options = {
//       page: pageNum,
//       limit: limitNum,
//     };

//     const users = await models.User.aggregatePaginate(
//       models.User.aggregate(pipeline),
//       options
//     );

//     // Check if users is valid
//     if (!users || !users.docs || users.docs.length === 0) {
//       return response.success('No users with matching badges found', null, res);
//     }

//     return response.success('Badge users fetched successfully', users, res);
//   } catch (error) {
//     console.error('Aggregation error:', error.message);
//     return response.error('Failed to fetch badge users', 500, res);
//   }
// });
  
const getAllBadgesUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", badge_name, chapter_name } = req.body;

  // Validate pagination inputs
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    return response.error('Invalid page or limit', 400, res);
  }

  // Build the aggregation pipeline
  let pipeline = [
    {
      $match: {
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'badges',
        localField: 'badges.badgeId',
        foreignField: '_id',
        as: 'badgeDetails',
      },
    },
    {
      $project: {
        name: 1,
        mobile_number: 1,
        email: 1,
        chapter_name: 1,
        badges: {
          $map: {
            input: '$badges',
            as: 'badge',
            in: {
              badgeId: '$$badge.badgeId',
              assignedAt: '$$badge.assignedAt',
              name: {
                $arrayElemAt: [
                  '$badgeDetails.name',
                  { $indexOfArray: ['$badgeDetails._id', '$$badge.badgeId'] },
                ],
              },
              image: {
                $arrayElemAt: [
                  '$badgeDetails.image',
                  { $indexOfArray: ['$badgeDetails._id', '$$badge.badgeId'] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $sort: { name: 1 },
    },
  ];

  // Add conditions to the match stage
  if (chapter_name) {
    pipeline[0].$match.chapter_name = chapter_name;
  }
  if (search) {
    pipeline[0].$match.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { mobile_number: { $regex: search, $options: 'i' } },
    ];
  }

  // Add badge_name filter if provided
  if (badge_name && typeof badge_name === 'string') {
    pipeline.splice(2, 0, {
      $match: {
        'badgeDetails.name': { $regex: badge_name, $options: 'i' },
      },
    });
  }

  try {
    // Execute aggregation with pagination
    const users = await models.User.aggregatePaginate(
      models.User.aggregate(pipeline),
      { page: pageNum, limit: limitNum }
    );

    // Check if users is valid
    if (!users || !users.docs || users.docs.length === 0) {
      return response.success('No users with matching badges found', null, res);
    }

    return response.success('Badge users fetched successfully', users, res);
  } catch (error) {
    console.error('Aggregation error:', error.message);
    return response.error('Failed to fetch badge users', 500, res);
  }
});

 export const badgeController ={
  createBadge,
  updateBadge,
  deleteBadge,
  getAllBadges,
  assignBadge,
  unassignBadge,
  getUserBadges,
  getAllBadgesUsers
};  