import { models } from "../../models/zindex.js";
import mongoose from "mongoose";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
import { leaderboardController } from "./leaderboard.controller.js";

import { QueryDocumentSnapshot } from "firebase-admin/firestore";
const createAttendance = asyncHandler(async (req, res) => {
  let { userId, eventId, event } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(eventId)
  ) {
    return response.serverError("Invalid userId or eventId", res);
  }

  const eventDetails = await models.Event.findById(eventId);
  if (!eventDetails) {
    return response.noContent("Event not found", res);
  }

      
// const createAttendance = asyncHandler(async (req, res) => {
//   let { userId, eventId, event } = req.body;

//   if (
//     !mongoose.Types.ObjectId.isValid(userId) ||
//     !mongoose.Types.ObjectId.isValid(eventId)
//   ) {
//     return response.serverError("Invalid userId or eventId", res);
//   }

//   const eventDetails = await models.Event.findById(eventId);
//   if (!eventDetails) {
//     return response.noContent("Event not found", res);
//   }


  




  

  const existingAttendance = await models.Attandance.findOne({
    userId,
    eventId,
    status: "present"
  });

  if (existingAttendance) {
    return response.conflict("Attendance already recorded", res);
  }

  const newAttendance = new models.Attandance({ userId, eventId, event });
  await newAttendance.save();

  if (eventDetails.event_or_meeting === "event") {
    leaderboardController.addPointsHistory(userId, "event attendance", res);
  }
  if (eventDetails.event_or_meeting === "meeting") {
    leaderboardController.addPointsHistory(userId, "attendance regular", res);
  }

  return response.create("Attendance recorded successfully", newAttendance, res);
})


const getAllAttendance = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { chapter_name, event_type, startDate, endDate } = req.query;
  const filters = [];
  if (chapter_name) {
    filters.push({
      "userData.chapter_name": { $regex: chapter_name, $options: "i" },
    });
  }
  if (event_type) {
    filters.push({ "eventData.event_or_meeting": event_type });
  }
  if (startDate && endDate) {
    filters.push({
      "eventData.date": {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
  } else if (startDate) {
    filters.push({ "eventData.date": { $gte: new Date(startDate) } });
  } else if (endDate) {
    filters.push({ "eventData.date": { $lte: new Date(endDate) } });
  }
  const matchStage =
    filters.length > 0 ? [{ $match: { $and: filters } }] : [];
  const aggregatePipeline = [
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: "$userData" },
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "eventData",
      },
    },
    { $unwind: "$eventData" },
    ...matchStage,
    {
      $project: {
        _id: 1,
        createdAt: 1,
        "userData._id": 1,
        "userData.name": 1,
        "userData.chapter_name": 1,
        "userData.profilePic": 1,
        "eventData._id": 1,
        "eventData.name": 1,
        "eventData.event_or_meeting": 1,
        "eventData.date": 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ];
  const allRecords = await models.Attandance.aggregate(aggregatePipeline);
  const totalDocs = allRecords.length;
  const totalPages = Math.ceil(totalDocs / limit);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;
  const prevPage = hasPrevPage ? page - 1 : null;
  const nextPage = hasNextPage ? page + 1 : null;
  const paginatedRecords = allRecords.slice(skip, skip + limit);
  return response.success("Attendance fetched", {
    docs: paginatedRecords,
    totalDocs,
    limit,
    totalPages,
    page,
    hasPrevPage,
    hasNextPage,
    prevPage,
    nextPage
  }, res);
})

const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { chapter, eventId, page = 1, limit = 10, search } = req.query;

  if (!chapter || !eventId) {
    return response.badRequest("Chapter and eventId are required parameters", res);
  }

  // Validate the event belongs to the chapter
  const event = await models.Event.findOne({
    _id: eventId,
    chapter_name: chapter
  });

  if (!event) {
    return response.notFound("Event not found for the specified chapter", res);
  }

  // Build base query for chapter users
  const userQuery = { chapter_name: chapter };
  
  // Add search functionality if search term is provided
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { mobile_number: { $regex: search, $options: 'i' } }
    ];
  }

  // Get paginated users belonging to the chapter
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    select: '_id name email mobile_number',
    lean: true
  };

  const chapterUsers = await models.User.paginate(userQuery, options);

  // Get all attendance records for this event (for the current page users)
  const userIds = chapterUsers.docs.map(user => user._id);
  const attendanceRecords = await models.Attandance.find(
    { 
      eventId,
      userId: { $in: userIds }
    },
    { userId: 1, status: 1 }
  );

  // Create a map of userId to attendance status for quick lookup
  const attendanceMap = new Map();
  attendanceRecords.forEach(record => {
    attendanceMap.set(record.userId.toString(), record.status);
  });

  // Prepare the response with paginated chapter users and their attendance status
  const docs = chapterUsers.docs.map(user => ({
    userId: user._id,
    name: user.name,
    chapter_name: chapter,
    email: user.email,
    mobile_number: user.mobile_number,
    status: attendanceMap.get(user._id.toString()) || 'absent'
  }));

  return response.success("Attendance records fetched successfully", {
    eventDetails: {
      id: event._id,
      name: event.name,
      date: event.date,
      mode: event.mode,
      location: event.location,
      chapter_name: event.chapter_name,
    },
    attendanceRecords: {
      docs,
      totalDocs: chapterUsers.totalDocs,
      limit: chapterUsers.limit,
      totalPages: chapterUsers.totalPages,
      page: chapterUsers.page,
      pagingCounter: chapterUsers.pagingCounter,
      hasPrevPage: chapterUsers.hasPrevPage,
      hasNextPage: chapterUsers.hasNextPage,
      prevPage: chapterUsers.prevPage,
      nextPage: chapterUsers.nextPage
    }
  }, res);
});

// Toggle attendance status (unchanged)
const toggleAttendanceStatus = asyncHandler(async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return response.badRequest("userId and eventId are required", res);
  }

  // Check if user exists and belongs to the same chapter as the event
  const user = await models.User.findById(userId);
  if (!user) {
    return response.notFound("User not found", res);
  }

  const event = await models.Event.findById(eventId);
  if (!event) {
    return response.notFound("Event not found", res);
  }
  
    const eventDate = event?.date || new Date();
  console.log("hvh", eventDate)

  if (user.chapter_name !== event.chapter_name) {
    return response.forbidden("User does not belong to the event's chapter", res);
  }

  // Find or create attendance record
  let attendance = await models.Attandance.findOne({ userId, eventId });

  // Determine points type based on event type
  const pointsType = event.event_or_meeting === 'event' ? 'event_attendance' : 'attendance_regular';
  let pointsChanged = false;

  if (!attendance) {
    // Create new record with status 'present'
    attendance = await models.Attandance.create({
      userId,
      eventId,
      status: 'present'
    });
    
    // Add points for new attendance
    const pointsResponse = await leaderboardController.addPointsHistory(userId, pointsType.replace('_', ' '), eventDate, res);
    pointsChanged = pointsResponse.success;
    
    return response.success(
      "Attendance marked as present", 
      { 
        attendance,
        pointsChanged,
        pointsMessage: pointsChanged ? "Points added successfully" : "Points not added"
      }, 
      res
    );
  }

  // Store previous status before toggling
  const previousStatus = attendance.status;
  
  // Toggle status
  const newStatus = attendance.status === 'present' ? 'absent' : 'present';
  attendance.status = newStatus;
  attendance.updatedAt = new Date();
  await attendance.save();

  // Handle points changes only if status actually changed
  if (previousStatus !== newStatus) {
    const leaderboardData = await models.Leaderboard.findOne({ 
      name: pointsType.replace('_', ' ') 
    });
    
    if (!leaderboardData) {
      console.error(`${pointsType} leaderboard not found`);
      return response.success(
        `Attendance status changed to ${newStatus} (points not updated - leaderboard not found)`,
        { 
          attendance,
          pointsChanged: false 
        },
        res
      );
    }

    const pointsValue = leaderboardData.point;

    // Scenario 1: Changing from absent to present - add points
    if (previousStatus === 'absent' && newStatus === 'present') {
      const pointsResponse = await leaderboardController.addPointsHistory(userId, pointsType.replace('_', ' '),eventDate, res);
      pointsChanged = pointsResponse.success;
      if (!pointsResponse.success) {
        console.error('Failed to add attendance points:', pointsResponse.error);
      }
    }
    // Scenario 2: Changing from present to absent - deduct points
    else if (previousStatus === 'present' && newStatus === 'absent') {
      // Deduct points
      user.points = Math.max(0, (user.points || 0) - pointsValue);
      
      // Update points history - remove one positive entry
      await models.PointsHistory.findOneAndUpdate(
        { userId },
        { $pull: { [`points.${pointsType}`]: { value: pointsValue } } },
        { new: true }
      );
      
      await user.save();
      pointsChanged = true;
    }
  }

  return response.success(
    `Attendance status changed to ${newStatus}`,
    { 
      attendance,
      pointsChanged,
      pointsMessage: pointsChanged ? 
        (newStatus === 'present' ? "Points added successfully" : "Points deducted successfully") : 
        "Points not changed"
    },
    res
  );
});


const getAllUpcomingEvents = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return response.serverError("Invalid or missing userId", res);
  }

  const user = await models.User.findById(userId).select("chapter_name");
  if (!user) {
    return response.serverError("User not found", res);
  }

  const currentDate = new Date();

  const events = await models.Event.find({
    date: { $gt: currentDate },
    chapter_name: user.chapter_name
  }).select("name date thumbnail chapter_name");

  return response.success("Upcoming events fetched", events, res);
});


// Removed duplicate declaration of getEventGallery

const getAllRecentEvents = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return response.serverError("Invalid or missing userId", res);
  }
  const user = await models.User.findById(userId).select("chapter_name");
  if (!user) {
    return response.serverError("User not found", res);
  }




  const currentDate = new Date();
  const events = await models.Event.find({ date: { $lt: currentDate } , chapter_name: user.chapter_name }).select("name date thumbnail chapter_name ");

  return response.success("Recent events fetched", events, res);

})



const createVisitor = asyncHandler(async (req, res) => {
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

  const newVisitor = new models.Visitor({
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
  });

  await newVisitor.save();
  return response.create("Visitor added successfully", newVisitor, res);
})

const getVisitorsByEventId = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!eventId || mongoose.Types.ObjectId.isValid(eventId) === false) {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing eventId",
    });
  }

  const visitors = await models.Visitor.find({ eventId }).populate(
    "refUserId",
    "name chapter_name profilePic"
  );

  if (!visitors || visitors.length === 0) {
    return response.noContent("No visitors found for this event", res);
  }
  return response.success("Visitors fetched successfully", visitors, res);

})
const getAllAttendanceUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // Or req.user.id if using auth middleware

  // Fetch all events
  const allEvents = await models.Event.find({}).select("name event_or_meeting paid thumbnail");

  // Fetch attendance records for the user
  const attendanceRecords = await models.Attandance.find({ userId })
    .populate({
      path: "eventId", // assuming 'event' is a ref in Attendance model
      select: "name event_or_meeting paid thumbnail",
    })
    .select("event createdAt"); // include createdAt from Attendance

  // Create a map of event IDs from attendance records for quick lookup
  const attendedEventIds = new Set(
    attendanceRecords.map((record) => record.event?._id?.toString())
  );

  // Build response with attendance status for all events
  const responseData = allEvents.map((event) => {
    const isPresent = attendedEventIds.has(event._id.toString());
    return {
      event: {
        _id: event._id,
        name: event.name,
        event_or_meeting: event.event_or_meeting,
        paid: event.paid,
        thumbnail: event.thumbnail,
      },
      createdAt: isPresent
        ? attendanceRecords.find(
          (record) => record.event?._id?.toString() === event._id.toString()
        )?.createdAt || null
        : null,
      status: isPresent ? "Present" : "Absent",
    };
  });

  // Calculate total present and absent counts
  const presentCount = responseData.filter((record) => record.status === "Present").length;
  const absentCount = responseData.filter((record) => record.status === "Absent").length;

  // Add counts to the response data
  const finalResponse = {
    docs: responseData,
    summary: {
      totalPresent: presentCount,
      totalAbsent: absentCount,
    },
  };

  res.status(200).json({ success: true, data: finalResponse });
});

const getAllEvents = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await models.User.findById(userId).select("chapter_name");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const events = await models.Event.find({ chapter_name: user.chapter_name })
      .select("name date thumbnail chapter_name");

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: "No events found" });
    }

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

const getEventGallery = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.body;

    // Validate event ID
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    // Find the event with gallery data
    const event = await models.Event.findById(eventId)
      .select('name date thumbnail photos videos location startTime endTime chapter_name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Format the response
    const galleryData = {
      eventId: event._id,
      name: event.name,
      date: event.date,
      thumbnail: event.thumbnail,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      chapter: event.chapter_name,
      media: {
        photos: event.photos.filter(photo => photo), // Remove empty strings
        videos: event.videos.filter(video => video)  // Remove empty strings
      }
    };

    res.status(200).json({
      success: true,
      data: galleryData
    });

  } catch (error) {
    console.error("Error in getEventGallery:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


const updateEventParticipation = asyncHandler(async (req, res) => {
  try {
    const { userId, eventId, preference } = req.body;

    // Validate input
    if (!userId || !eventId || !preference) {
      return response.badRequest("userId, eventId, and preference are required", res);
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return response.badRequest("Invalid ID format", res);
    }

    if (!['yes', 'no', 'substitute'].includes(preference)) {
      return response.badRequest("Preference must be 'yes', 'no', or 'substitute'", res);
    }

    // Check if user and event exist
    const userExists = await models.User.exists({ _id: userId });
    const eventExists = await models.Event.exists({ _id: eventId });

    if (!userExists || !eventExists) {
      return response.notFound("User or Event not found", res);
    }

    // Update or create participation record
    const participation = await models.Participation.findOneAndUpdate(
      { userId, eventId },
      { preference },
      { 
        new: true,
        upsert: true // Create if doesn't exist
      }
    );

    return response.success("Participation preference updated", participation, res);

  } catch (error) {
    console.error("Error in updateEventParticipation:", error);
    return response.serverError(error.message, res);
  }
});

const getUserEventParticipation = asyncHandler(async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Validate input
    if (!userId || !eventId) {
      return response.badRequest("userId and eventId are required", res);
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return response.badRequest("Invalid ID format", res);
    }

    // Get participation record
    const participation = await models.Participation.findOne({
      userId,
      eventId
    }).populate('eventId', 'name date location');

    if (!participation) {
      return response.success("No participation record found", { preference: null }, res);
    }

    return response.success("Participation record found", participation, res);

  } catch (error) {
    console.error("Error in getUserEventParticipation:", error);
    return response.serverError(error.message, res);
  }
});
//admin

const getEventParticipants = asyncHandler(async (req, res) => {
  try {
    const { eventId, preference, page = 1, limit = 10 } = req.body;

    // Validate input
    if (!eventId) {
      return response.badRequest("eventId is required", res);
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return response.badRequest("Invalid event ID format", res);
    }

    // Build query
    const query = { eventId };
    if (preference && ['yes', 'no', 'substitute'].includes(preference)) {
      query.preference = preference;
    }

    // Pagination options with population
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'userId', select: 'name profilePic chapter_name' },
        { path: 'eventId', select: 'name date' }
      ],
      sort: { createdAt: -1 }
    };

    const result = await models.Participation.paginate(query, options);

    return response.success("Participants retrieved successfully", result, res);

  } catch (error) {
    console.error("Error in getEventParticipants:", error);
    return response.serverError(error.message, res);
  }
});





export const attendanceController = {
  createAttendance,
  getAllAttendance,
  getAllUpcomingEvents,
  getAllRecentEvents,
  createVisitor,
  getVisitorsByEventId,
  getAllAttendanceUserId,
  getAllEvents,
  getEventGallery,
  updateEventParticipation,
  getUserEventParticipation,
  getEventParticipants,
  getAttendanceRecords,
  toggleAttendanceStatus

}