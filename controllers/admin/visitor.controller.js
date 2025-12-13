import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
import { leaderboardController } from "./leaderboard.controller.js";
const getAllVisitors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { name, refUserId, eventId, paid, chapter_name, startDate, endDate } = req.query;

  // Base query
  let query = {};
  if (name) query.name = new RegExp(name, "i");
  if (refUserId) query.refUserId = refUserId;
  if (eventId) query.eventId = eventId;
  if (paid !== undefined) query.paid = paid === "true";

  // Date range filter (on createdAt)
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + "T23:59:59.999Z"), // ⬅ inclusive endDate
    };
  } else if (startDate) {
    query.createdAt = { $gte: new Date(startDate) };
  } else if (endDate) {
    query.createdAt = { $lte: new Date(endDate + "T23:59:59.999Z") }; // ⬅ inclusive
  }

  // First fetch all visitors with basic filters
  let visitorQuery = models.Visitor.find(query)
    .sort({ createdAt: -1 }) // sort by createdAt desc
    .populate({
      path: "refUserId",
      select: "name chapter_name profilePic",
    })
    .populate({
      path: "eventId",
      select: "name startDate endDate chapter_name",
    });

  // Execute the query
  let visitors = await visitorQuery;

  // Apply chapter_name filter after populate if chapter_name is provided
  if (chapter_name) {
    visitors = visitors.filter(visitor => 
      visitor.eventId && 
      visitor.eventId.chapter_name && 
      visitor.eventId.chapter_name.toLowerCase().includes(chapter_name.toLowerCase())
    );
  }

  if (visitors.length === 0) {
    return response.success("No Visitors found", null, res);
  }

  const totalDocs = visitors.length;
  const totalPages = Math.ceil(totalDocs / limit);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;
  const prevPage = hasPrevPage ? page - 1 : null;
  const nextPage = hasNextPage ? page + 1 : null;

  // Pagination after filtering
  const paginatedVisitors = visitors.slice(skip, skip + limit);

  return response.success("Visitors fetched successfully", {
    docs: paginatedVisitors,
    totalDocs,
    limit,
    totalPages,
    page,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage,
  }, res);
});


// const toggleVisitorAttendance = asyncHandler(async (req, res) => {
//   const { visitorId } = req.body;

//   if (!visitorId) {
//     return response.badRequest("Visitor ID is required", res);
//   }

//   try {
//     const visitor = await models.Visitor.findById(visitorId);
//     if (!visitor) {
//       return response.notFound("Visitor not found", res);
//     }

//     const previousStatus = visitor.attendanceStatus;

//     // Toggle status
//     visitor.attendanceStatus = visitor.attendanceStatus === 'present' ? 'absent' : 'present';
//     visitor.updatedAt = new Date();
    
//     await visitor.save();

//     let pointsResponse = { success: false };

//     if (previousStatus !== visitor.attendanceStatus) {
//       const leaderboardData = await models.Leaderboard.findOne({ name: 'visitor' });

//       if (!leaderboardData) {
//         console.error('Visitor leaderboard not found');
//         return response.success(
//           `Visitor attendance status changed to ${visitor.attendanceStatus} (points not updated - leaderboard not found)`,
//           { visitor },
//           res
//         );
//       }

//       const pointsValue = leaderboardData.point;
//       const user = await models.User.findById(visitor.refUserId);

//       if (!user) {
//         console.error('Referrer user not found');
//         return response.success(
//           `Visitor attendance status changed to ${visitor.attendanceStatus} (points not updated - referrer not found)`,
//           { visitor },
//           res
//         );
//       }

//       if (previousStatus === 'absent' && visitor.attendanceStatus === 'present') {
//         // ✅ Now handles res inside this controller
//         pointsResponse = await leaderboardController.addPointsHistory(visitor.refUserId, 'visitor');
//         if (!pointsResponse.success) {
//           console.error('Failed to add visitor points:', pointsResponse.error);
//         }
//       } else if (previousStatus === 'present' && visitor.attendanceStatus === 'absent') {
//         // Deduct points
//         user.points = Math.max(0, (user.points || 0) - pointsValue);
//         await models.PointsHistory.findOneAndUpdate(
//           { userId: visitor.refUserId },
//           { $pull: { 'points.visitor': { value: pointsValue } } },
//           { new: true }
//         );
//         await user.save();
//       }
//     }

//     return response.success(
//       `Visitor attendance status changed to ${visitor.attendanceStatus}`,
//       {
//         visitor,
//         points: pointsResponse.data?.point || 0,
//         message: pointsResponse.message || ''
//       },
//       res
//     );
//   } catch (error) {
//     console.error('Error updating visitor attendance:', error);
//     return response.error("Error updating visitor attendance", res);
//   }
// });

const toggleVisitorAttendance = asyncHandler(async (req, res) => {
  const { visitorId } = req.body;

  if (!visitorId) {
    return response.badRequest("Visitor ID is required", res);
  }

  try {
    const visitor = await models.Visitor.findById(visitorId);
    if (!visitor) {
      return response.notFound("Visitor not found", res);
    }

    const previousStatus = visitor.attendanceStatus;

    // Toggle status
    visitor.attendanceStatus = visitor.attendanceStatus === 'present' ? 'absent' : 'present';
    visitor.updatedAt = new Date();
    await visitor.save();

    let pointsResponse = { success: false };

    if (previousStatus !== visitor.attendanceStatus) {
      const leaderboardData = await models.Leaderboard.findOne({ name: 'visitor' });

      if (!leaderboardData) {
        console.error('Visitor leaderboard not found');
        return response.success(
          `Visitor attendance status changed to ${visitor.attendanceStatus} (points not updated - leaderboard not found)`,
          { visitor },
          res
        );
      }

      const pointsValue = leaderboardData.point;
      const user = await models.User.findById(visitor.refUserId);

      if (!user) {
        console.error('Referrer user not found');
        return response.success(
          `Visitor attendance status changed to ${visitor.attendanceStatus} (points not updated - referrer not found)`,
          { visitor },
          res
        );
      }

      if (previousStatus === 'absent' && visitor.attendanceStatus === 'present') {

        const event = await models.Event.findById(visitor.eventId);
  const eventDate = event?.date || new Date();
  console.log("hgvhgv", eventDate);
        // ✅ Now handles res inside this controller
        pointsResponse = await leaderboardController.addPointsHistory(visitor.refUserId, 'visitor',eventDate);
        if (!pointsResponse.success) {
          console.error('Failed to add visitor points:', pointsResponse.error);
        }
      } else if (previousStatus === 'present' && visitor.attendanceStatus === 'absent') {
        // Deduct points
        user.points = Math.max(0, (user.points || 0) - pointsValue);
        await models.PointsHistory.findOneAndUpdate(
          { userId: visitor.refUserId },
          { $pull: { 'points.visitor': { value: pointsValue } } },
          { new: true }
        );
        await user.save();
      }
    }

    return response.success(
      `Visitor attendance status changed to ${visitor.attendanceStatus}`,
      {
        visitor,
        points: pointsResponse.data?.point || 0,
        message: pointsResponse.message || ''
      },
      res
    );
  } catch (error) {
    console.error('Error updating visitor attendance:', error);
    return response.error("Error updating visitor attendance", res);
  }
});


const updateVisitor =asyncHandler( async (req, res) => {
  const { visitorId } = req.params;
  const {
    name,
    refUserId,
    eventId,
    fees,
    paid,
    mobile_number,
    email,
    business_name,
    business_type,
    address,
    pincode,
  } = req.body;

    const updatedVisitor = await models.Visitor.findByIdAndUpdate(
      visitorId,
      {
        name,
        refUserId,
        eventId,
        fees,
        paid,
        mobile_number,
        email,
        business_name,
        business_type,
        address,
        pincode,
      },
      { new: true }
    );

    if (!updatedVisitor) {
      return response.success("Visitor not found", rnull,es);
    }

    return response.success("Visitor updated successfully", updatedVisitor, res);
})


export const visitorController={
    updateVisitor,
    getAllVisitors,
    toggleVisitorAttendance
}