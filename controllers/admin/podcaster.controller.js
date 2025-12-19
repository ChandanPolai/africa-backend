

import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';


import moment from 'moment-timezone';

const createPodcast = asyncHandler(async (req, res) => {
  const { podcasterName,  aboutPodcaster, venue, startDate, endDate } = req.body;
let podcasterImage = '';
  if(req.file) {
  podcasterImage = req.file.path.replace(/\\/g, '/'); // Normalize path for cross-platform compatibility
  }
  
  // Validate dates
  const startMoment = moment.tz(startDate, 'Asia/Kolkata');
  const endMoment = moment.tz(endDate, 'Asia/Kolkata');
  
  if (endMoment.isBefore(startMoment)) {
    return response.error("End date must be after start date", res);
  }

  const podcast = await models.Podcast.create({
    podcasterName,
    podcasterImage,
    aboutPodcaster,
    venue,
    startDate: startMoment.toDate(),
    endDate: endMoment.toDate(),
    
  });

  return response.success("Podcast created successfully", { podcast }, res);
});


// Podcast Management
const getAllPodcasts = asyncHandler(async (req, res) => {
  const { status, dateFrom, dateTo, page = 1, limit = 10, search = "" } = req.query;

  const filter = {};

  if (search && search.trim() !== "") {
    const regex = new RegExp(search, 'i'); // Case-insensitive
    filter.podcasterName = regex; // Assuming field is `podcasterName`
  }

  if (status) filter.status = status;

  if (dateFrom && dateTo) {
    filter.startDate = {
      $gte: moment.tz(dateFrom, 'Asia/Kolkata').startOf('day').toDate(),
      $lte: moment.tz(dateTo, 'Asia/Kolkata').endOf('day').toDate()
    };
  }

  const options = {
    sort: { startDate: 1 },
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    lean: true
  };

  const result = await models.Podcast.paginate(filter, options);

  return response.success("Podcasts retrieved", {
    podcasts: result.docs,
    total: result.totalDocs,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage
  }, res);
});


const updatePodcast = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Handle image file upload
  if (req.file) {
    updates.podcasterImage = req.file.path.replace(/\\/g, '/'); // Normalize path for cross-platform compatibility
  }

  // Handle date updates if provided
  if (updates.startDate) {
    updates.startDate = moment.tz(updates.startDate, 'Asia/Kolkata').toDate();
  }
  if (updates.endDate) {
    updates.endDate = moment.tz(updates.endDate, 'Asia/Kolkata').toDate();
  }

  // Validate dates if both are provided
  if (updates.startDate && updates.endDate) {
    const startMoment = moment.tz(updates.startDate, 'Asia/Kolkata');
    const endMoment = moment.tz(updates.endDate, 'Asia/Kolkata');
    
    if (endMoment.isBefore(startMoment)) {
      return response.error("End date must be after start date", 400, res);
    }
  }

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
const generateSlots = asyncHandler(async (req, res) => {
    const { podcastId, dates, startTime, endTime, duration, capacity } = req.body;
    
    // Validate inputs
    if (!podcastId || !dates || !dates.length || !startTime || !endTime || !duration || !capacity) {
      return response.error("Missing required fields", 400, res);
    }
  
    const podcast = await models.Podcast.findById(podcastId);
    if (!podcast) {
      return response.error("Podcast not found", 404, res);
    }
  
    // Parse times in IST
    const startTimeMoment = moment.tz(startTime, 'HH:mm', 'Asia/Kolkata');
    const endTimeMoment = moment.tz(endTime, 'HH:mm', 'Asia/Kolkata');
    
    if (endTimeMoment.isSameOrBefore(startTimeMoment)) {
      return response.error("End time must be after start time", 400, res);
    }
  
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return response.error("Invalid duration", 400, res);
    }
  
    const slots = [];
    const errors = [];
  
    for (const dateStr of dates) {
      // Parse date in IST and ensure it's start of day
      const dateMoment = moment.tz(dateStr, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day');
      
      // Check if date is within podcast date range
      const podcastStart = moment.tz(podcast.startDate, 'Asia/Kolkata').startOf('day');
      const podcastEnd = moment.tz(podcast.endDate, 'Asia/Kolkata').endOf('day');
      
      if (dateMoment.isBefore(podcastStart) || dateMoment.isAfter(podcastEnd)) {
        errors.push(`Date ${dateStr} is outside podcast date range (${podcast.startDate} to ${podcast.endDate})`);
        continue;
      }
  
      let currentSlotStart = startTimeMoment.clone();
      
      while (currentSlotStart.isBefore(endTimeMoment)) {
        const currentSlotEnd = currentSlotStart.clone().add(durationMinutes, 'minutes');
        
        if (currentSlotEnd.isAfter(endTimeMoment)) {
          break;
        }
  
        // Check for overlapping slots
        const existingSlot = await models.PodcastSlot.findOne({
          podcastId,
          date: dateMoment.toDate(),
          $or: [
            {
              startTime: { $lt: currentSlotEnd.format('HH:mm') },
              endTime: { $gt: currentSlotStart.format('HH:mm') }
            }
          ]
        });
  
        if (!existingSlot) {
          const slot = await models.PodcastSlot.create({
            podcastId,
            date: dateMoment.toDate(),
            startTime: currentSlotStart.format('HH:mm'),
            endTime: currentSlotEnd.format('HH:mm'),
            capacity
          });
          
          // Format the response with proper IST dates
          const formattedSlot = {
            ...slot.toObject(),
            date: moment(slot.date).tz('Asia/Kolkata').format('YYYY-MM-DD'),
            startTimeIST: slot.startTime,
            endTimeIST: slot.endTime,
            startTimeUTC: moment.tz(`${moment(slot.date).format('YYYY-MM-DD')} ${slot.startTime}`, 'Asia/Kolkata').utc().format(),
            endTimeUTC: moment.tz(`${moment(slot.date).format('YYYY-MM-DD')} ${slot.endTime}`, 'Asia/Kolkata').utc().format()
          };
          
          slots.push(formattedSlot);
        }
  
        currentSlotStart = currentSlotEnd.clone();
      }
    }
  
    if (slots.length === 0 && errors.length > 0) {
      return response.error(`No slots created. Errors: ${errors.join(', ')}`, 400, res);
    }
  
    return response.success("Slots generated successfully", { 
      slots, 
      errors: errors.length > 0 ? errors : undefined 
    }, res);
  });
  
  const getUpcomingPodcasts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
  
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { startDate: 1 }
    };
  
    const query = {
      status: 'upcoming',
      endDate: { $gte: new Date() }
    };
  
    const result = await models.Podcast.paginate(query, options);
  
    return response.success("Upcoming podcasts fetched", {
      podcasts: result.docs,
      pagination: {
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        nextPage: result.nextPage,
        prevPage: result.prevPage,
      }
    }, res);
  });
  
  const podcastById = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    const podcast = await models.Podcast.findById(id);
    if (!podcast) {
      return response.error("Podcast not found", 404, res);
    }
  
    return response.success("Podcast details fetched", { podcast }, res);
  });
export const podcastController= {
  createPodcast,
  podcastById,
  generateSlots,
  getUpcomingPodcasts,
  getAllPodcasts,
  updatePodcast,
  deletePodcast

};

  