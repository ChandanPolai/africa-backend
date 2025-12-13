// controllers/admin.controller.js
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import moment from 'moment-timezone';

// Podcast Management
const getAllPodcasts = asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  if (dateFrom && dateTo) {
    filter.startDate = { 
      $gte: moment.tz(dateFrom, 'Asia/Kolkata').startOf('day').toDate(),
      $lte: moment.tz(dateTo, 'Asia/Kolkata').endOf('day').toDate()
    };
  }

  const podcasts = await models.Podcast.find(filter)
    .sort({ startDate: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');

  const total = await models.Podcast.countDocuments(filter);

  return response.success("Podcasts retrieved", {
    podcasts,
    total,
    totalPages: Math.ceil(total / limit)
  }, res);
});

const getPodcastDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const podcast = await models.Podcast.findById(id)
    .populate('createdBy', 'name email')
    .populate({
      path: 'slots',
      select: 'date startTime endTime capacity bookedCount status'
    });

  if (!podcast) {
    return response.error("Podcast not found", 404, res);
  }

  return response.success("Podcast details retrieved", { podcast }, res);
});

const updatePodcast = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const podcast = await models.Podcast.findByIdAndUpdate(
    id, 
    updates,
    { new: true, runValidators: true }
  );

  if (!podcast) {
    return response.error("Podcast not found", 404, res);
  }

  return response.success("Podcast updated successfully", { podcast }, res);
});

const deletePodcast = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First delete all associated slots
  await models.PodcastSlot.deleteMany({ podcastId: id });
  
  // Then delete the podcast
  const podcast = await models.Podcast.findByIdAndDelete(id);

  if (!podcast) {
    return response.error("Podcast not found", 404, res);
  }

  return response.success("Podcast deleted successfully", {}, res);
});

// Slot Management
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

const getSlotbyPodcastId = asyncHandler(async (req, res) => {
  const { podcastId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  

const option = {page : parseInt(page), limit: parseInt(limit)};
const slot = await models.PodcastSlot.paginate({ podcastId}, option);
if(!slot) {
  return response.error("No slots found for this podcast", 404, res);
}
return response.success("Slots retrieved successfully", { slot }, res);
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

const getBookingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await models.PodcastBooking.findById(id)
    .populate({
      path: 'slotId',
      populate: {
        path: 'podcastId',
        select: 'podcasterName podcasterImage aboutPodcaster venue'
      }
    })
    .populate('userId', 'name email profilePic')
    .populate('processedBy', 'name');

  if (!booking) {
    return response.error("Booking not found", 404, res);
  }

  return response.success("Booking details retrieved", { booking }, res);
});

const getBookingsByPodcast = asyncHandler(async (req, res) => {
  const { podcastId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { 'slotId.podcastId': podcastId };
  if (status) filter.status = status;

  const bookings = await models.PodcastBooking.find(filter)
    .populate({
      path: 'slotId',
      select: 'date startTime endTime'
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.PodcastBooking.countDocuments(filter);

  return response.success("Podcast bookings retrieved", {
    bookings,
    total,
    totalPages: Math.ceil(total / limit)
  }, res);
});

const getBookingsBySlot = asyncHandler(async (req, res) => {
  const { slotId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { slotId };
  if (status) filter.status = status;

  const bookings = await models.PodcastBooking.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await models.PodcastBooking.countDocuments(filter);

  return response.success("Slot bookings retrieved", {
    bookings,
    total,
    totalPages: Math.ceil(total / limit)
  }, res);
});

// Analytics
const getBookingStatistics = asyncHandler(async (req, res) => {
  const stats = await models.PodcastBooking.aggregate([
    {
      $lookup: {
        from: 'podcastslots',
        localField: 'slotId',
        foreignField: '_id',
        as: 'slot'
      }
    },
    { $unwind: '$slot' },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$slot.capacity' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        totalCapacity: 1,
        _id: 0
      }
    }
  ]);

  return response.success("Booking statistics", { stats }, res);
});

const getPodcastStatistics = asyncHandler(async (req, res) => {
  const stats = await models.Podcast.aggregate([
    {
      $lookup: {
        from: 'podcastslots',
        localField: '_id',
        foreignField: 'podcastId',
        as: 'slots'
      }
    },
    {
      $lookup: {
        from: 'podcastbookings',
        localField: '_id',
        foreignField: 'slotId.podcastId',
        as: 'bookings'
      }
    },
    {
      $project: {
        podcasterName: 1,
        startDate: 1,
        endDate: 1,
        status: 1,
        totalSlots: { $size: '$slots' },
        totalBookings: { $size: '$bookings' },
        upcomingSlots: {
          $size: {
            $filter: {
              input: '$slots',
              as: 'slot',
              cond: { 
                $and: [
                  { $gte: ['$$slot.date', new Date()] },
                  { $eq: ['$$slot.status', 'available'] }
                ]
              }
            }
          }
        }
      }
    },
    { $sort: { startDate: 1 } }
  ]);

  return response.success("Podcast statistics", { stats }, res);
});

const exportBookings = asyncHandler(async (req, res) => {
  const { podcastId, dateFrom, dateTo } = req.query;
  
  const filter = {};
  if (podcastId) filter['slotId.podcastId'] = podcastId;
  if (dateFrom && dateTo) {
    filter.createdAt = {
      $gte: moment.tz(dateFrom, 'Asia/Kolkata').startOf('day').toDate(),
      $lte: moment.tz(dateTo, 'Asia/Kolkata').endOf('day').toDate()
    };
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
    .sort({ createdAt: -1 });

  // Convert to CSV format (simplified example)
  let csv = 'Booking ID,Podcast,User,Date,Time,Status\n';
  bookings.forEach(booking => {
    const slotDate = moment(booking.slotId.date).tz('Asia/Kolkata').format('DD-MM-YYYY');
    csv += `${booking._id},${booking.slotId.podcastId.podcasterName},${booking.userId.name},${slotDate},${booking.slotId.startTime}-${booking.slotId.endTime},${booking.status}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=podcast_bookings.csv');
  return res.send(csv);
});

export const podcastAdminController = {
  // Podcast Management
  getAllPodcasts,
  getPodcastDetails,
  updatePodcast,
  deletePodcast,
  getSlotbyPodcastId,
  
  // Slot Management
  getAllSlots,
  updateSlot,
  deleteSlot,
  bulkDeleteSlots,
  
  // Booking Management
  getAllBookings,
  getBookingDetails,
  getBookingsByPodcast,
  getBookingsBySlot,
  
  // Analytics
  getBookingStatistics,
  getPodcastStatistics,
  
  // Export
  exportBookings
};