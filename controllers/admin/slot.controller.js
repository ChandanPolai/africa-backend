// controllers/podcastSlot.controller.js
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import moment from 'moment-timezone';
import  mongoose from 'mongoose';

// const getAvailableSlots = asyncHandler(async (req, res) => {
//   const { podcastId, date } = req.query;
  
//   if (!podcastId || !date) {
//     return response.error("Podcast ID and date are required", res);
//   }

//   const dateMoment = moment.tz(date, 'Asia/Kolkata').startOf('day');
//   const todayMoment = moment.tz('Asia/Kolkata').startOf('day');

//   if (dateMoment.isBefore(todayMoment)) {
//     return response.success("No slots available for past dates", { slots: [] }, res);
//   }

//   const slots = await models.PodcastSlot.find({
//     podcastId,
//     date: dateMoment.toDate(),
//     status: 'available',
//     bookedCount: { $lt: '$capacity' } // Not full
//   }).sort({ startTime: 1 });

//   // Format times in IST for response
//   const formattedSlots = slots.map(slot => ({
//     ...slot.toObject(),
//     startTimeIST: slot.startTime,
//     endTimeIST: slot.endTime,
//     startTimeUTC: moment.tz(`${moment(slot.date).format('YYYY-MM-DD')} ${slot.startTime}`, 'Asia/Kolkata').utc().format(),
//     endTimeUTC: moment.tz(`${moment(slot.date).format('YYYY-MM-DD')} ${slot.endTime}`, 'Asia/Kolkata').utc().format()
//   }));

//   return response.success("Available slots fetched", { slots: formattedSlots }, res);
// });
const getAvailableSlots = asyncHandler(async (req, res) => { 
  const { podcastId, date, page = 1, limit = 10 } = req.query;
  
  if (!podcastId || !date) {
    return response.error("Podcast ID and date are required", 500, res);
  }

  try {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Parse input date in IST and get start of day in UTC
    const startOfDayIST = moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day');
    const startOfDayUTC = startOfDayIST.clone().utc();
    const endOfDayUTC = startOfDayIST.clone().add(1, 'day').utc();

    console.log('Date search range:', {
      inputDate: date,
      startOfDayIST: startOfDayIST.format(),
      startOfDayUTC: startOfDayUTC.format(),
      endOfDayUTC: endOfDayUTC.format()
    });

    const query = {
      podcastId: new mongoose.Types.ObjectId(podcastId),
      date: {
        $gte: startOfDayUTC.toDate(),
        $lt: endOfDayUTC.toDate()
      },
      status: 'available',
      $expr: { $lt: ["$bookedCount", "$capacity"] }
    };

    const total = await models.PodcastSlot.countDocuments(query);

    const slots = await models.PodcastSlot.find(query)
      .sort({ startTime: 1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    console.log(`Found ${slots.length} available slots`);

    const formattedSlots = slots.map(slot => ({
      id: slot._id,
      date: moment(slot.date).tz('Asia/Kolkata').format('YYYY-MM-DD'),
      startTimeIST: slot.startTime,
      endTimeIST: slot.endTime,
      startTimeUTC: moment.tz(`${moment(slot.date).format('YYYY-MM-DD')} ${slot.startTime}`, 'Asia/Kolkata').utc().format(),
      endTimeUTC: moment.tz(`${moment(slot.date).format('YYYY-MM-DD')} ${slot.endTime}`, 'Asia/Kolkata').utc().format(),
      capacity: slot.capacity,
      bookedCount: slot.bookedCount,
      remaining: slot.capacity - slot.bookedCount
    }));

    return response.success("Available slots fetched", {
      slots: formattedSlots,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }, res);
  } catch (error) {
    console.error('Error fetching slots:', error);
    return response.error("Error fetching slots", 500, res);
  }
});
const getAllSlots = asyncHandler(async (req, res) => {
  const { podcastId, date, status, page = 1, limit = 10 } = req.query;
  
  const filter = {};
  if (podcastId) filter.podcastId = podcastId;
  if (date) filter.date = moment.tz(date, 'Asia/Kolkata').startOf('day').toDate();
  if (status) filter.status = status;

  const slots = await models.PodcastSlot.find(filter)
    .sort({ date: 1, startTime: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.PodcastSlot.countDocuments(filter);

  return response.success("Slots retrieved", {
    slots,
    total,
    totalPages: Math.ceil(total / limit)
  }, res);
});

const updateSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { capacity, status } = req.body;

  const slot = await models.PodcastSlot.findByIdAndUpdate(
    id,
    { capacity, status },
    { new: true, runValidators: true }
  );

  if (!slot) {
    return response.error("Slot not found", 404, res);
  }

  return response.success("Slot updated successfully", { slot }, res);
});

const deleteSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First check if there are any bookings for this slot
  const bookingsCount = await models.PodcastBooking.countDocuments({ slotId: id });
  if (bookingsCount > 0) {
    return response.error("Cannot delete slot with existing bookings", 400, res);
  }

  const slot = await models.PodcastSlot.findByIdAndDelete(id);
  if (!slot) {
    return response.error("Slot not found", 404, res);
  }

  return response.success("Slot deleted successfully", {}, res);
});

const bulkDeleteSlots = asyncHandler(async (req, res) => {
  const { slotIds } = req.body;

  // Check if any of the slots have bookings
  const bookedSlots = await models.PodcastBooking.countDocuments({ 
    slotId: { $in: slotIds } 
  });

  if (bookedSlots > 0) {
    return response.error("Cannot delete slots with existing bookings", 400, res);
  }

  const result = await models.PodcastSlot.deleteMany({ 
    _id: { $in: slotIds } 
  });

  return response.success("Slots deleted successfully", { deletedCount: result.deletedCount }, res);
});

// Booking Management
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo, podcastId, page = 1, limit = 10 } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  
  if (dateFrom && dateTo) {
    filter.createdAt = {
      $gte: moment.tz(dateFrom, 'Asia/Kolkata').startOf('day').toDate(),
      $lte: moment.tz(dateTo, 'Asia/Kolkata').endOf('day').toDate()
    };
  }
  
  if (podcastId) {
    filter['slotId.podcastId'] = podcastId;
  }

  const bookings = await models.PodcastBooking.find(filter)
    .populate({
      path: 'slotId',
      populate: {
        path: 'podcastId',
        select: 'podcasterName'
      }
    })
    .populate('userId', 'name email')
    .populate('processedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.PodcastBooking.countDocuments(filter);

  return response.success("Bookings retrieved", {
    bookings,
    total,
    totalPages: Math.ceil(total / limit)
  }, res);
});



export const slotController= {
  getAvailableSlots,
  getAllSlots,
  updateSlot,
  deleteSlot,
  bulkDeleteSlots,
  
};
