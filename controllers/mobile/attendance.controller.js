import { models } from "../../models/zindex.js";
import mongoose from "mongoose";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
import { leaderboardController } from "./leaderboard.controller.js";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import moment from "moment-timezone";
// const createAttendance = asyncHandler(async (req, res) => {
//   let { userId, eventId, event } = req.body;
//   console.log("Request Body:", req.body);

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


//   const existingAttendance = await models.Attandance.findOne({
//     userId,
//     eventId,
//     status: "present"

//   });

//   if (existingAttendance) {
//     return response.conflict("Attendance already recorded", res);
//   }

//   const newAttendance = new models.Attandance({ userId, eventId, event });
//   await newAttendance.save();

//   if (eventDetails.event_or_meeting === "event") {
//     leaderboardController.addPointsHistory(userId, "event attendance", res);
//   }
//   if (eventDetails.event_or_meeting === "meeting") {
//     leaderboardController.addPointsHistory(userId, "attendance regular", res);
//   }

//   return response.create("Attendance recorded successfully", newAttendance, res);
// })

const createAttendance = asyncHandler(async (req, res) => {
  let { userId, eventId, event={} } = req.body;
  console.log("Request Body:", req.body);

  
  // Extract eventId from nested event object if eventId is not provided directly
  if (!eventId && event && event._id) {
    eventId = event._id;
    console.log("Extracted eventId from event object:", eventId);
  }
  event = event || {
    };

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

  const existingAttendance = await models.Attandance.findOne({
    userId,
    eventId,
    status: "present"
  });

  if (existingAttendance) {
    return response.conflict("Attendance already recorded", res);
  }

  // Use the extracted eventId and create the event object if needed
  const attendanceData = {
    userId,
    eventId,
    event: event || {
      _id: eventId,
      name: eventDetails.name,
      event_or_meeting: eventDetails.event_or_meeting
    }
  };

  const newAttendance = new models.Attandance(attendanceData);
  await newAttendance.save();

  if (eventDetails.event_or_meeting === "event") {
    leaderboardController.addPointsHistory(userId, "event attendance", res);
  }
  if (eventDetails.event_or_meeting === "meeting") {
    leaderboardController.addPointsHistory(userId, "attendance regular", res);
  }

  return response.create("Attendance recorded successfully", newAttendance, res);
});

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

// const getAllAttendance = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;
//   const { userId, event_type, startDate, endDate } = req.query;

//   // Validate userId
//   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//     return response.error("Valid User ID is required", null, res, 400);
//   }

//   // Fetch the chapter name of the provided user
//   const user = await models.User.findById(userId).select("chapter_name").lean();
//   if (!user || !user.chapter_name) {
//     return response.error("User or chapter not found", null, res, 404);
//   }
//   const chapterName = user.chapter_name.trim(); // Trim to avoid whitespace issues

//   // Build filters
//   const filters = [
//     { "userData.chapter_name": { $eq: chapterName } }, // Exact match for chapter name
//   ];

//   if (event_type) {
//     filters.push({ "eventData.event_or_meeting": event_type });
//   }
//   if (startDate && endDate) {
//     filters.push({
//       "eventData.date": {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       },
//     });
//   } else if (startDate) {
//     filters.push({ "eventData.date": { $gte: new Date(startDate) } });
//   } else if (endDate) {
//     filters.push({ "eventData.date": { $lte: new Date(endDate) } });
//   }

//   const matchStage = filters.length > 0 ? [{ $match: { $and: filters } }] : [];

//   const aggregatePipeline = [
//     {
//       $lookup: {
//         from: "users",
//         localField: "userId",
//         foreignField: "_id",
//         as: "userData",
//       },
//     },
//     { $unwind: { path: "$userData", preserveNullAndEmptyArrays: false } },
//     {
//       $lookup: {
//         from: "events",
//         localField: "eventId",
//         foreignField: "_id",
//         as: "eventData",
//       },
//     },
//     { $unwind: { path: "$eventData", preserveNullAndEmptyArrays: false } },
//     ...matchStage,
//     {
//       $project: {
//         _id: 1,
//         createdAt: 1,
//         "userData._id": 1,
//         "userData.name": 1,
//         "userData.chapter_name": 1,
//         "userData.profilePic": 1,
//         "eventData._id": 1,
//         "eventData.name": 1,
//         "eventData.event_or_meeting": 1,
//         "eventData.date": 1,
//       },
//     },
//     { $sort: { createdAt: -1 } },
//   ];

//   // Log the pipeline for debugging (remove in production)
//   console.log("Aggregation Pipeline:", JSON.stringify(aggregatePipeline, null, 2));
//   console.log("Chapter Name Filter:", chapterName);

//   const allRecords = await models.Attendance.aggregate(aggregatePipeline); // Fixed typo
//   const totalDocs = allRecords.length;
//   const totalPages = Math.ceil(totalDocs / limit);
//   const hasPrevPage = page > 1;
//   const hasNextPage = page < totalPages;
//   const prevPage = hasPrevPage ? page - 1 : null;
//   const nextPage = hasNextPage ? page + 1 : null;
//   const paginatedRecords = allRecords.slice(skip, skip + limit);

//   // Log the result for debugging (remove in production)
//   console.log("Records Fetched:", allRecords.map(record => record.userData.chapter_name));

//   return response.success("Attendance fetched", {
//     docs: paginatedRecords,
//     totalDocs,
//     limit,
//     totalPages,
//     page,
//     hasPrevPage,
//     hasNextPage,
//     prevPage,
//     nextPage,
//   }, res);
// });



// const getAllUpcomingEvents = asyncHandler(async (req, res) => {
//   const { userId } = req.body;

//   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//     return response.serverError("Invalid or missing userId", res);
//   }

//   const user = await models.User.findById(userId).select("chapter_name");
//   if (!user) {
//     return response.serverError("User not found", res);
//   }

//   const currentDate = new Date();

//   const events = await models.Event.find({
//     date: { $gt: currentDate },
//     chapter_name: user.chapter_name
//   }).select("name date thumbnail chapter_name");

//   return response.success("Upcoming events fetched", events, res);
// });


// Removed duplicate declaration of getEventGallery




const getAllUpcomingEvents = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return response.serverError("Invalid or missing userId", res);
  }
  const user = await models.User.findById(userId).select("chapter_name");
  if (!user) {
    return response.serverError("User not found", res);
  }
  const events = await models.Event.find({
    chapter_name: user.chapter_name
  }).select("name date thumbnail chapter_name");
  return response.success("Upcoming events fetched", events, res);
});

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
  const events = await models.Event.find({ date: { $lt: currentDate }, chapter_name: user.chapter_name }).select("name date thumbnail chapter_name ");

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

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing eventId",
    });
  }

  const visitors = await models.Visitor.find({ eventId }).populate(
    "refUserId",
    "name chapter_name profilePic"
  );

  return res.status(200).json({
    success: true,
    message: visitors.length > 0 ? "Visitors fetched successfully" : "No visitors found for this event",
    data: visitors || [],
  });
})

const getAllAttendanceUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // Or req.user.id if using auth middleware

  // First get the user's chapter
  const user = await models.User.findById(userId).select('chapter_name');
  if (!user) {
    return response.error("User not found", 404, res);
  }

  // Fetch only past events from the user's chapter
  const currentDate = new Date();
  const chapterEvents = await models.Event.find({
    chapter_name: user.chapter_name,
    date: { $lte: currentDate } // Only events that have already occurred
  }).select("name event_or_meeting paid thumbnail date");

  // Fetch attendance records for the user
  const attendanceRecords = await models.Attandance.find({ userId })
    .populate({
      path: "eventId",
      select: "name event_or_meeting paid thumbnail date",
    })
    .select("event createdAt");

  // Create a map of event IDs from attendance records for quick lookup
  const attendedEventIds = new Set(
    attendanceRecords.map((record) => record.eventId?._id?.toString())
  );

  // Build response with attendance status for chapter events only
  const responseData = chapterEvents.map((event) => {
    const isPresent = attendedEventIds.has(event._id.toString());
    return {
      event: {
        _id: event._id,
        name: event.name,
        event_or_meeting: event.event_or_meeting,
        paid: event.paid,
        thumbnail: event.thumbnail,
        date: event.date // Include event date in response
      },
      createdAt: isPresent
        ? attendanceRecords.find(
          (record) => record.eventId?._id?.toString() === event._id.toString()
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
      chapter: user.chapter_name // Include chapter name in response
    },
  };

  return response.success("Attendance data fetched", finalResponse, res);
});

const getAllAttendanceUserIds = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // Or req.user.id if using auth middleware

  // First get the user's chapter
  const user = await models.User.findById(userId).select('chapter_name');
  if (!user) {
    return response.error("User not found", 404, res);
  }

  // Fetch only past events from the user's chapter
  const currentDate = new Date();
  const chapterEvents = await models.Event.find({
    chapter_name: user.chapter_name,
    // Only events that have already occurred
  }).select("name event_or_meeting paid thumbnail date");

  // Fetch attendance records for the user
  const attendanceRecords = await models.Attandance.find({ userId })
    .populate({
      path: "eventId",
      select: "name event_or_meeting paid thumbnail date",
    })
    .select("event createdAt");

  // Create a map of event IDs from attendance records for quick lookup
  const attendedEventIds = new Set(
    attendanceRecords.map((record) => record.eventId?._id?.toString())
  );

  // Build response with attendance status for chapter events only
  const responseData = chapterEvents.map((event) => {
    const isPresent = attendedEventIds.has(event._id.toString());
    return {
      event: {
        _id: event._id,
        name: event.name,
        event_or_meeting: event.event_or_meeting,
        paid: event.paid,
        thumbnail: event.thumbnail,
        date: event.date // Include event date in response
      },
      createdAt: isPresent
        ? attendanceRecords.find(
          (record) => record.eventId?._id?.toString() === event._id.toString()
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
      chapter: user.chapter_name // Include chapter name in response
    },
  };

  return response.success("Attendance data fetched", finalResponse, res);
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
      .select("name date thumbnail chapter_name mode startTime endTime location");

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: "No events found" });
    }

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

const getAllEventForAllUser = asyncHandler(async (req, res) => {
  try {


    const events = await models.Event.find().select("name date thumbnail chapter_name mapURL location");

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: "No events found" });
    }

    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching all events:", error);
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

const getCurrentEventDay = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return response.badRequest("Invalid or missing userId", res);
    }

    const user = await models.User.findById(userId);
    if (!user) {
      return response.notFound("User not found", res);
    }

    const chapterName = user.chapter_name;

    // Get current date & time in Asia/Kolkata
    const currentIST = moment().tz('Asia/Kolkata');
    const currentISTDateOnly = currentIST.clone().startOf('day');
    const currentTimeFormatted = currentIST.format('hh:mm A');

    // Log for debugging
    console.log("User:", user.name);
    console.log("Chapter:", chapterName);
    console.log("Current Time:", currentTimeFormatted);
    console.log("Current Date (IST):", currentISTDateOnly.format("YYYY-MM-DD"));

    // Find event with matching chapter, today's date, and matching endTime
    const event = await models.Event.findOne({
      chapter_name: chapterName,
      date: {
        $gte: currentISTDateOnly.toDate(),
        $lt: currentISTDateOnly.clone().add(1, 'day').toDate()
      },
    });


    if (!event) {
      console.log("No Event matched today with current end time.");
      return response.success("No event ending right now", { currentEventDay: false, feedbackGiven: false }, res);
    }

    const eventEndTime = moment.tz(
      `${moment(event.date).format('YYYY-MM-DD')} ${event.endTime}`,
      'YYYY-MM-DD hh:mm A',
      'Asia/Kolkata'
    );

    if (!event.endTime || currentIST.isBefore(eventEndTime)) {
      console.log("Event is not ending now");
      return response.success("Event is not ending now", { currentEventDay: false, feedbackGiven: false }, res);
    }

    const attendance = await models.Attandance.findOne({
      userId: user._id,
      eventId: event._id,
      status: "present"
    });

    if (!attendance) {
      console.log("No attendance matched today with current end time.");
      return response.success("No attendance right now", { currentEventDay: false, feedbackGiven: false }, res);
    }

    const currentEventDay = !!attendance;

    const feedbackGiven = await models.Feedback.findOne({
      userId: user._id,
      eventId: event._id,
    });

    if (feedbackGiven) {
      console.log("Feedback given");
      return response.success("Feedback Given", { currentEventDay: true, feedbackGiven: true }, res);
    }

    return response.success("Event day check complete, Give feedback", {
      currentEventDay,
      feedbackGiven: false,
      eventId: event._id,
      eventName: event.name,
      attendanceStatus: attendance?.status || 'not marked'
    }, res);

  } catch (error) {
    console.error("Error in getCurrentEventDay:", error);
    return response.serverError(error.message, res);
  }
});

//admin

const getEventParticipants = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.body;
    const { preference } = req.body;

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

    // Get participants with user details
    const participants = await models.Participation.find(query)
      .populate('userId', 'name profilePic chapter_name')
      .populate('eventId', 'name date');

    return response.success("Participants retrieved", participants, res);

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
  getAllEventForAllUser,
  updateEventParticipation,
  getUserEventParticipation,
  getEventParticipants,
  getCurrentEventDay,
}