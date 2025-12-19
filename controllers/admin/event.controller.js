import asyncHandler from 'express-async-handler';
import { models } from "../../models/zindex.js";// assuming you're importing this
import { response } from "../../utils/response.js";
import {mongoose} from 'mongoose';
import axios from 'axios';
import moment from 'moment-timezone';
import { notificationController } from "../mobile/notification.controller.js";
// const createScanVisitor = asyncHandler(async (req, res) => {
//   const {
//     // eventId,
//     // event,
//     // name,
//     // referBy,
//     // mobile_number,
//     // email,
//     // businessCategory,
//     // address,
//     // pincode,
//     // preferences

//     name,
//     refUserId,
//     eventId,
//     fees,
//     paid,
//     mobile_number,
//     email,
//     business_name,
//     business_type,
//     address,
//     pincode,
    
//   } = req.body;

//   // Validate required fields
//   if (!eventId || !name || !mobile_number) {
//     return response.error('Event ID, name, and mobile number are required', 400, res);
//   }

//   try {
//     // Create new visitor record
//     const newVisitor = new models.VisitorScanner({
//       eventId,
//       event,
//       name,
//       referBy: referBy || "",
//       mobile_number,
//       email: email || "",
//       businessCategory: businessCategory || "",
//       address: address || "",
//       pincode: pincode || "",
//       preferences: preferences || "Maybe"
//     });

//     // Save to database
//     const savedVisitor = await newVisitor.save();

//     return response.success('Visitor data submitted successfully', savedVisitor, res);
//   } catch (error) {
//     console.error('Error submitting visitor data:', error);
//     if (error.name === 'ValidationError') {
//       return response.error(error.message, 400, res);
//     }
//     return response.error(error.message, 500, res);
//   }
// });


// const createScanVisitor = asyncHandler(async (req, res) => {
//   const {
//     name,
//     refUserId,
//     eventId,
//     mobile_number,
//     email,
//     business_type,
//     address,
//   } = req.body;

//   // Validate required fields
//   if (!name || !refUserId || !eventId || !mobile_number) {
//     return response.error('Missing required fields (name, refUserId, eventId, mobile_number)', 400, res);
//   }

//   // Validate mobile number format
//   if (!/^[0-9]{10}$/.test(mobile_number)) {
//     return response.error("Mobile number must be a valid 10-digit number.", 400, res);
//   }

//   const newVisitor = new models.Visitor({
//     name,
//     refUserId,
//     eventId,
//     mobile_number,
//     email,
//     business_type,
//     address,
//   });

//   try {
//     await newVisitor.save();

//     // Digital card creation payload
//     const digitalCardPayload = {
//       name: name.trim(),
//       email: email || "",
//       mobile: mobile_number,
//       businessKeyword: business_type || "africa-community",
//       originId: "685a80c61ecf5bcb96968fb7", // Same as in the other API
//       countryCode: "91"
//     };

//     console.log("Digital Card Payload:", digitalCardPayload);

//     let digitalCardResponse = null;
//     let digitalCardError = null;

//     try {
//       const apiResponse = await axios.post(
//         'https://gbscard.itfuturz.in/web/create-account/mobile',
//         digitalCardPayload,
//         {
//           headers: {
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       digitalCardResponse = apiResponse.data;

//       if (digitalCardResponse && digitalCardResponse.data?.path) {
//         newVisitor.digitalCardLink = digitalCardResponse.data.path;
//         await newVisitor.save();
//       }
//     } catch (error) {
//       console.error('Digital card creation failed:', error);
//       digitalCardError = {
//         message: error.message,
//         response: error.response?.data || null,
//         status: error.response?.status || 500
//       };
//     }

//     const successResponse = {
//       visitorId: newVisitor._id,
//       registrationStatus: 'success',
//       digitalCard: {
//         attempted: true,
//         status: digitalCardError ? 'failed' : 'success',
//         response: digitalCardError ? digitalCardError : digitalCardResponse,
//         timestamp: new Date()
//       }
//     };

//     return response.success('Visitor created successfully', successResponse, res);

//   } catch (error) {
//     console.error('Visitor creation error:', error);

//     if (error.name === 'ValidationError') {
//       const errors = {};
//       for (const field in error.errors) {
//         errors[field] = error.errors[field].message;
//       }
//       return response.error('Validation error', 400, res);
//     }

//     return response.error("Server error during visitor creation", 500, res);
//   }
// });










const createScanVisitor = asyncHandler(async (req, res) => {
  const {
    name,
    refUserId,
    eventId,
    mobile_number,
    email,
    business_type,
    address,
  } = req.body;

  // Validate required fields
  if (!name || !refUserId || !eventId || !mobile_number) {
    return response.error('Missing required fields (name, refUserId, eventId, mobile_number)', 400, res);
  }

  // Validate mobile number format
  if (!/^[0-9]{10}$/.test(mobile_number)) {
    return response.error("Mobile number must be a valid 10-digit number.", 400, res);
  }

  const newVisitor = new models.Visitor({
    name,
    refUserId,
    eventId,
    mobile_number,
    email,
    business_type,
    address,
    attendanceStatus:'present'
  });

  try {
    await newVisitor.save();


     let pointsResponse = { success: false };
    if (refUserId) {
      pointsResponse = await leaderboardController.addPointsHistory(refUserId, "visitor");
      if (!pointsResponse.success) {
        console.error('Failed to add visitor points:', pointsResponse.error);
      }
    }

    // Digital card creation payload
    const digitalCardPayload = {
      name: name.trim(),
      email: email || "",
      mobile: mobile_number,
      businessKeyword: business_type || "africa-community",
      originId: "685a80c61ecf5bcb96968fb7", // Same as in the other API
      countryCode: "91"
    };

    console.log("Digital Card Payload:", digitalCardPayload);

    let digitalCardResponse = null;
    let digitalCardError = null;
    let whatsappResponse = null;
    let whatsappError = null;

    try {
      const apiResponse = await axios.post(
        'https://gbscard.itfuturz.in/web/create-account/mobile',
        digitalCardPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      digitalCardResponse = apiResponse.data;

      if (digitalCardResponse && digitalCardResponse.data?.path) {
        newVisitor.digitalCardLink = digitalCardResponse.data.path;
        await newVisitor.save();

        // Prepare WhatsApp message
        const message = `Dear ${name},

We are truly grateful for your presence at the Global Business Social! 🙏✨ It was an honor to have you with us.

As a token of our appreciation, we're delighted to gift you a *Digital Business Profile* - our small way to support your business growth journey.

Your exclusive access:
- Profile: ${digitalCardResponse.data.path}
- Portal: https://gbscustomer.itfuturz.in
- Email: ${email || mobile_number}
- Password: user@1234
(You may change your password after first login)

We sincerely hope this adds value to your business. Thank you for being an important part of the africa-community family. 

Warm regards,
[Africa Community Team]`;

        // Send WhatsApp message
        try {
          const whatsappApiResponse = await axios.post(
            'https://whatsapp.itfuturz.in/api/send-message',
            {
              sessionId: "8264abd4-34ab-47de-aac1-0a8e01ed621f",
              to: mobile_number,
              message: message
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          whatsappResponse = whatsappApiResponse.data;
        } catch (whatsappErr) {
          console.error('WhatsApp message sending failed:', whatsappErr);
          whatsappError = {
            message: whatsappErr.message,
            response: whatsappErr.response?.data || null,
            status: whatsappErr.response?.status || 500
          };
        }
      }
    } catch (error) {
      console.error('Digital card creation failed:', error);
      digitalCardError = {
        message: error.message,
        response: error.response?.data || null,
        status: error.response?.status || 500
      };
    }

    const successResponse = {
      visitorId: newVisitor._id,
      registrationStatus: 'success',
      digitalCard: {
        attempted: true,
        status: digitalCardError ? 'failed' : 'success',
        response: digitalCardError ? digitalCardError : digitalCardResponse,
        timestamp: new Date()
      },
      whatsappNotification: {
        attempted: digitalCardResponse && digitalCardResponse.data?.path ? true : false,
        status: whatsappError ? 'failed' : (whatsappResponse ? 'success' : 'not_attempted'),
        response: whatsappError ? whatsappError : whatsappResponse,
        timestamp: new Date()
      }
    };

    return response.success('Visitor created successfully', successResponse, res);

  } catch (error) {
    console.error('Visitor creation error:', error);

    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return response.error('Validation error', 400, res);
    }

    return response.error("Server error during visitor creation", 500, res);
  }
});
//  const getUsersByEventId = async (req, res) => {
//   try {
//     const { eventId } = req.query;
//     const { page = 1, limit = 10 } = req.query;

//     // Validate eventId
//     if (!eventId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Event ID is required'
//       });
//     }

//     // Find the event to get chapter_name
//     const event = await models.Event.findById(eventId);
    
//     if (!event) {
//       return res.status(404).json({
//         success: false,
//         message: 'Event not found'
//       });
//     }

//     const chapterName = event.chapter_name;

//     // Set up pagination options
//     const options = {
//       page: parseInt(page, 10),
//       limit: parseInt(limit, 10),
//       sort: { createdAt: -1 }
//     };

//     // Query users with pagination
//     const users = await models.User.paginate(
//       { chapter_name: chapterName },
//       options
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Users fetched successfully',
//       data: users
//     });

//   } catch (error) {
//     console.error('Error in getUsersByEventId:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };


export const getUsersByEventId = async (req, res) => {
  try {
    const { eventId, search, page = 1, limit = 10 } = req.query;

    // Validate eventId
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Find the event to get chapter_name
    const event = await models.Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    

    // Build query
    const query = { };
    
    // Add search if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Set up pagination options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { name: 1 }, // Sort by name ascending
      select: '_id name chapter_name' // Only return these fields
    };

    // Query users with pagination
    const users = await models.User.paginate(query, options);

    // Format response to match your requested structure
    const formattedResponse = {
      success: true,
      message: 'Users fetched successfully',
      data: {
        users: users.docs,
        pagination: {
          total: users.totalDocs,
          limit: users.limit,
          page: users.page,
          pages: users.totalPages
        }
      }
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Error in getUsersByEventId:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getAllEvents = asyncHandler(async (req, res) => {
  const events = await models.Event.find().sort({ createdAt: -1 });
  return response.success('Events fetched successfully', events, res);
});

const eventByChapter = asyncHandler(async (req, res) => {
  const { chapter_name } = req.params;
  
  // Validate chapter name exists
  if (!chapter_name) {
    return response.error("Chapter name is required", 404,res);
  }

  try {
    const events = await models.Event.find({ chapter_name }).select('name date chapter_name startTime endTime details mapURL location thumbnail')
      .sort({ date: -1 }) // Typically sort by event date rather than createdAt
      .lean(); // Use lean() for better performance
    
    if (!events || events.length === 0) {
      return response.success('No events found for this chapter', { events: [] }, res);
    }
    
    return response.success('Events fetched successfully', { events }, res);
  } catch (error) {
    return response.serverError("Error fetching events", res);
  }
});


// const createEvent = asyncHandler(async (req, res) => {
//   const eventData = { ...req.body };
//   if (req.file) {
//     eventData.thumbnail = req.file.path.replace(/\\/g, "/");
//   }

//   const event = new models.Event(eventData);
//   await event.save();
//   return response.create('Event created successfully', event, res);
// });

const createEvent = asyncHandler(async (req, res) => {
  const eventData = { ...req.body };
  if (req.file) {
    eventData.thumbnail = req.file.path.replace(/\\/g, "/");
  }

  const event = new models.Event(eventData);
  await event.save();

  // Fetch all users in the specified chapter
  const chapterMembers = await models.User.find({ 
    chapter_name: eventData.chapter_name 
  }).select('_id name');

  // Send notification to each chapter member
  if (chapterMembers.length > 0) {
    const notificationPromises = chapterMembers.map(member => 
      notificationController.NotificationService.createNotification({
        userId: member._id,
        triggeredBy: null, // Assuming the authenticated user is creating the event
        title: "New Event Created!",
        relatedEntity: event._id, // Add this
        entityType: 'event', // Add this
 
        type: "event",
        description: `A new event "${eventData.name}" has been created for your chapter.`,
        message: "",
      })
    );
    
    await Promise.all(notificationPromises);
  }

  return response.create('Event created successfully', event, res);
});

const sendNotificationToUser = asyncHandler(async (req, res) => {
  const { userId, title, description, message } = req.body;

  // Validate request body
  if (!userId || !title || !description) {
    return res.status(400).json({ 
      success: false, 
      message: "userId, title, and description are required" 
    });
  }

  // Verify user exists
  const user = await models.User.findById(userId);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: "User not found" 
    });
  }

  // Create notification
  const notification = await notificationController.NotificationService.createNotification({
    userId,
    triggeredBy: req.user?._id || null, // Assuming authenticated admin user
    title,
    description,
    message: message || "",
  });

  return res.status(200).json({
    success: true,
    message: "Notification sent successfully",
    data: notification,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const deletedEvent = await models.Event.findByIdAndDelete(eventId);
  if (!deletedEvent) {
    return response.success('Event not found', null,res);
  }
  return response.success('Event deleted successfully', true, res);
});

const addPhotos = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!req.files || req.files.length === 0) {
     return response.requiredField('Please upload at least one photo', res);
  }

  const event = await models.Event.findById(eventId);
  if (!event) {
    return response.success('Event not found', null,res);
  }

  const photoPaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
  event.photos.push(...photoPaths);
  await event.save();

   return response.success('Photos added successfully', { photos: photoPaths, event }, res);
});

const addVideos = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!req.files || req.files.length === 0) {
     return response.requiredField('Please upload at least one video', res);
  }

  const event = await models.Event.findById(eventId);
  if (!event) {
     return response.success('Event not found', null,res);
  }

  const videoPaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
  event.videos.push(...videoPaths);
  await event.save();

 return response.success('Videos added successfully', { videos: videoPaths, event }, res);
});

const updateEvent = asyncHandler(async (req, res) => {
  console.log("Update Event Request Body:", JSON.stringify(req.body, null, 2));
  console.log("Update Event File:", req.file ? req.file.path : 'No file uploaded');

  // Extract fields from req.body
  const {
      eventId,
      name,
      date,
      startTime,
      endTime,
      amount,
      mode,
      event_or_meeting,
      mapURL,
      details,
      paid,
      location,
      chapter_name
  } = req.body;

  console.log("eventId:", eventId);
  console.log("FormData Fields:", JSON.stringify(req.body, null, 2));

  // Validate eventId
  if (!eventId) {
      return response.error('Event ID is required', null, res, 400);
  }

  // Prepare update fields
  const updateFields = {
      name,
      date,
      startTime,
      endTime,
      mode,
      mapURL,
      details,
      amount,
      event_or_meeting,
      paid: paid === 'true' || paid === true, // Handle string or boolean
      location,
      chapter_name
  };

  // Handle thumbnail if uploaded
  if (req.file) {
      updateFields.thumbnail = req.file.path.replace(/\\/g, "/"); // Match createEvent logic
  }

  // Remove undefined fields
  Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

  try {
      const updatedEvent = await models.Event.findByIdAndUpdate(
          eventId,
          { $set: updateFields },
          { new: true }
      );

      if (!updatedEvent) {
          return response.error('Event not found', null, res, 404);
      }

      console.log("Updated Event:", JSON.stringify(updatedEvent, null, 2));
      return response.success('Event updated successfully', updatedEvent, res);
  } catch (error) {
      console.error("Update Error:", error);
      return response.error(error.message || 'Failed to update event', null, res, 500);
  }
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

  const matchStage = filters.length > 0 ? [{ $match: { $and: filters } }] : [];

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
        "userData.name": 1,
        "userData.chapter_name": 1,
        "userData.profilePic": 1,
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

  return response.success('Attendance records fetched', {
    docs: paginatedRecords,
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

const deleteAttendance = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;

  const deletedAttendance = await models.Attandance.findByIdAndDelete(attendanceId);
  if (!deletedAttendance) {
    return response.success('Attendance record not found', null,res);
  }

  return response.success('Attendance record deleted successfully', true, res);
});

const getEventGallery = asyncHandler(async (req, res) => {
  console.log("getEventGallery Request Body:", req.body);

  try {
    const { eventId } = req.body;
    console.log("Parsed eventId:", eventId);

    // Validate event ID
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format"
      });
    }

    // Check if model exists
    console.log("Event model exists:", !!models.Event);

    // Find the event
    const event = await models.Event.findById(eventId)
      .select('name date thumbnail photos videos location startTime endTime chapter_name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Format response
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
        photos: event.photos.filter(Boolean),
        videos: event.videos.filter(Boolean)
      }
    };

    res.status(200).json({
      success: true,
      data: galleryData
    });

  } catch (error) {
    console.error("Error in getEventGallery:", error); // 🔥 THIS WILL SHOW THE REAL ERROR
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export const eventController = {
  getAllEvents,
  createEvent,
  deleteEvent,
  addPhotos,
  addVideos,
  updateEvent,
  eventByChapter,
  getAllAttendance,
  deleteAttendance,
  getEventGallery,
  sendNotificationToUser,
  createScanVisitor,
  getUsersByEventId
};
