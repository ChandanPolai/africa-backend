// controllers/podcastBooking.controller.js

import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import { notificationController } from "../mobile/notification.controller.js";
import moment from 'moment-timezone';

const requestBooking = asyncHandler(async (req, res) => {
  const { slotId, userId } = req.body;

  // Check if slot exists and is available
  const slot = await models.PodcastSlot.findById(slotId)
    .populate({
      path: 'podcastId',
      select: 'podcasterName podcasterImage aboutPodcaster venue startDate endDate status isActive'
    });

  if (!slot || slot.status !== 'available' || slot.isFull) {
    return response.error("This slot is not available for booking", 500, res);
  }

  // Check if podcast exists and is active
  if (!slot.podcastId || !slot.podcastId.isActive) {
    return response.error("Podcast not found or deleted", 404, res);
  }

  // Check if user already has a pending/accepted booking for this slot
  const existingBooking = await models.PodcastBooking.findOne({
    slotId,
    userId,
    status: { $in: ['pending', 'accepted'] }
  });

  if (existingBooking) {
    return response.success("You already have a booking for this slot", false, res);
  }

  

  // Check if user already has accepted booking for this podcast
  const acceptedBooking = await models.PodcastBooking.findOne({
    userId,
    status: 'accepted'
  }).populate({
    path: 'slotId',
    populate: {
      path: 'podcastId',
      match: { _id: slot.podcastId._id } // ensure same podcast
    }
  });

  if (acceptedBooking && acceptedBooking.slotId && acceptedBooking.slotId.podcastId) {
    return response.success(
      `You already have an accepted booking for ${slot.podcastId.podcasterName}'s podcast`,
      false,
      res
    );
  }

  // Create booking request
  const booking = await models.PodcastBooking.create({
    slotId,
    userId,
    status: 'pending'
  });

  return response.success("Booking request submitted", { booking }, res);
});


const processBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  const { action, adminNotes } = req.body;
  const validActions = ['pending', 'accepted', 'rejected', 'cancelled'];

  if (!validActions.includes(action)) {
    return response.error("Invalid action provided", 400, res);
  }

  // Find the booking
  const booking = await models.PodcastBooking.findById(bookingId);
  if (!booking) {
    return response.error("Booking not found", 404, res);
  }

  // Get the slot details
  const slot = await models.PodcastSlot.findById(booking.slotId);

  if (!slot || !slot.isActive) {
    return response.error("Slot not found or is inactive", 404, res);
  }

  // On accept, check live accepted count vs. capacity
  if (action === "accepted") {
    const liveAcceptedCount = await models.PodcastBooking.countDocuments({
      slotId: slot._id, status: 'accepted'
    });

    if (liveAcceptedCount >= slot.capacity) {
      return response.error("This slot is now full and cannot be accepted", 500, res);
    }
  }

  // Store the current status before changing it
  const oldStatus = booking.status;

  // Update booking status, notes, and processed time
  booking.status = action;
  booking.adminNotes = adminNotes || booking.adminNotes;
  booking.processedAt = new Date();
  await booking.save();

  // If accepted, increment bookedCount (atomic, check +1 doesn’t overflow)
  if (action === "accepted") {
    const updatedSlot = await models.PodcastSlot.findOneAndUpdate(
      { _id: slot._id, bookedCount: { $lt: slot.capacity } },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );
    if (!updatedSlot) {
      return response.error("Slot just became full. Try another slot.", 500, res);
    }

    // If slot now full, update status
    if (updatedSlot.bookedCount >= updatedSlot.capacity) {
      updatedSlot.status = "closed";
      await updatedSlot.save();
    }
  }

  // If action is "rejected" or "cancelled" and booking was previously accepted, decrease bookedCount
  if ((action === "rejected" || action === "cancelled"||action==="pending") && oldStatus === "accepted") {
    await models.PodcastSlot.findByIdAndUpdate(
      slot._id,
      { $inc: { bookedCount: -1 } }
    );
  }

  // Populate for response as needed
  await booking.populate([
    { path: 'userId', select: 'name email avatar fcm' },
    { path: 'slotId' }
  ]);
  if (booking.userId.fcm) {
    await notificationController.NotificationService.createNotification({
      userId: booking.userId._id,
      triggeredBy: null,
      title: `Podcast Booking ${action === 'accepted' ? 'Approved' : 'Rejected'}`,
      description: `Your booking request has been ${action}`,
      message: adminNotes || `Slot: ${moment(booking.slotId.date).format('DD MMM YYYY')} ${booking.slotId.startTime}-${booking.slotId.endTime}`,
      relatedEntity: booking._id, // Add this
        entityType: 'podcast' ,// Add this
        type: "podcast",
    });
  }


  

  return response.success("Booking processed successfully", booking, res);
});
  // Notify user
  

 
 
 


      


       

  const bookingByPodcastId = asyncHandler(async (req, res) => {
    const { podcastId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;
    
    if (!podcastId) {
      return response.error("Podcast ID is required", 500, res);
    }
  
    const slots = await models.PodcastSlot.find({ podcastId }, { _id: 1 });
    if (!slots || slots.length === 0) {
      return response.success("No slots found for this podcast", false, res);
    }
  
    const slotIds = slots.map((s) => s._id);
  
    // Build the base query
    const query = { slotId: { $in: slotIds } };
  
    // Add search conditions if search term is provided
    if (search) {
      const userQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile_number: { $regex: search, $options: 'i' } }
        ]
      };
  
      // Find users that match the search criteria
      const matchingUsers = await models.User.find(userQuery, { _id: 1 });
      const matchingUserIds = matchingUsers.map(user => user._id);
  
      // Add userId condition to the main query
      query.userId = { $in: matchingUserIds };
    }
  
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        {
          path: "slotId",
          select: "date startTime endTime capacity bookedCount status",
        },
        {
          path: "userId",
          select: "name mobile_number profilePic chapter_name",
        },
      ],
    };
  
    const bookings = await models.PodcastBooking.paginate(query, options);
    if (!bookings || bookings.docs.length === 0) {
      return response.success("No bookings found for this podcast", true, res);
    }
  
    return response.success(
      "Bookings fetched successfully",
      bookings,
      res
    );
  });

  


const getUserBookings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { userId };
  if (status) {
    query.status = status;
  }

  const bookings = await models.PodcastBooking.find(query)
    .populate({
      path: 'slotId',
      populate: {
        path: 'podcastId',
        select: 'podcasterName podcasterImage aboutPodcaster venue'
      }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.PodcastBooking.countDocuments(query);

  return response.success("Bookings fetched", {
    bookings,
    total,
    totalPages: Math.ceil(total / limit)
  }, res);
});
const getAllBookingsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (!userId) {
    return response.error("User ID is required", res);
  }

  const user = await models.User.findById(userId);
  if (!user) {
    return response.error("User not found", res);
  }

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'slotId',
        model: 'PodcastSlot',
        populate: {
          path: 'podcastId',
          model: 'Podcast',
          select: 'podcasterName podcasterImage aboutPodcaster venue startDate endDate status'
        }
      }
    ]
  };

  const bookings = await models.PodcastBooking.paginate(
    { userId },
    options
  );

  return response.success("User bookings fetched", bookings, res);
});


const getCompletedBookingStats = asyncHandler(async (req, res) => {

  const { userId } = req.params;
  const completedBookings = await models.PodcastBooking.find({ userId, status: 'completed' })
    .populate('slotId')
  
  return response.success("Completed bookings fetched", { completedBookings }, res);
} );

export const podcastBookingController = {
  requestBooking,
  processBooking,
  
  getUserBookings,
  getAllBookingsByUserId,
  getCompletedBookingStats,
  bookingByPodcastId
};