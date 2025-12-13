// notification.service.js (ESM Version)
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { models } from '../../models/zindex.js';
import { helpers } from '../../utils/helpers.js';

class NotificationService {
  // static async createNotification({ type, userId, triggeredBy, title, description,message, relatedEntity }) {
  //   try {
  //     if (!userId ||  !title) {
  //       throw new Error('Missing required notification fields');
  //     }

  //     const user = await models.User.findById(userId);
  //     if (!user) return null;

  //     const notification = await models.Notification.create({
  //       userId,
  //       triggeredBy,
  //       title,
  //       type,
  //       description,
  //       message,
  //       relatedEntity,
  //     });
  //     console.log('Notification created:', notification); 

  //     if (user.fcm) {
  //       await helpers.sendNotification(user.fcm, title, description);
  //     }

  //     return notification;
  //   } catch (error) {
  //     console.error('Error creating notification:', error);
  //     throw error;
  //   }
  // }

  static async createNotification({ 
    type, 
    userId, 
    triggeredBy, 
    title, 
    description,
    message, 

    
    relatedEntity,
    entityType = ""  // Add this parameter
  }) {
    try {
      if (!userId || !title) {
        throw new Error('Missing required notification fields');
      }

      const user = await models.User.findById(userId);
      if (!user) return null;

      const notification = await models.Notification.create({
        userId,
        triggeredBy,
        title,
        type,
        description,
        message,
        relatedEntity,
        entityType  // Store this field
      });
      
      
      console.log('Notification created:', notification); 

      if (user.fcm) {
        // Update FCM payload to include entity info
        const fcmData = {
          title,
          body: description,
          data: {
            entityType,
            relatedEntity: relatedEntity ? relatedEntity.toString() : '',
            notificationId: notification._id.toString()
          }
        };
        await helpers.sendNotification(user.fcm, fcmData);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
static async getUserNotifications(userId, page = 1, limit = 10) {
    try {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [{ path: 'triggeredBy', select: 'name profilePic businessName' }],
      };

      return await models.Notification.paginate({ userId, isDeleted: false }, options);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      return await models.Notification.findOneAndUpdate(
        { _id: notificationId, userId, isDeleted: false },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async updateNotificationPreferences(userId, newPreferences) {
    try {
      const user = await models.User.findById(userId);
      if (!user) throw new Error('User not found');

      const updatedPreferences = {
        ...user.notificationPreferences.toObject(),
        ...newPreferences,
      };

      const updatedUser = await models.User.findByIdAndUpdate(
        userId,
        { $set: { notificationPreferences: updatedPreferences } },
        { new: true }
      );

      return updatedUser.notificationPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
}

const getNotifications = asyncHandler(async (req, res) => {
  const { error, value } = validator.getNotifications.validate(req.body);
  if (error) return response.success(error.details[0].message, null, res);

  const { page, limit } = value;
  const userId = req.user.userId;

  const notifications = await models.Notification.find({ userId, isDeleted: false })
    .select('-userId')
    .populate('triggeredBy', 'name profilePic businessName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalNotifications = await models.Notification.countDocuments({ userId, isDeleted: false });

  return response.success('Notifications fetched successfully!', {
    notifications,
    totalNotifications,
    totalPages: Math.ceil(totalNotifications / limit),
    page: parseInt(page),
    totalNotifications,
  }, res);
})
const getNotificationsById = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const query = { userId, isDeleted: false };
  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: {
      path: 'triggeredBy',
      select: 'name profilePic',
    },
  };

  const result = await models.Notification.paginate(query, options);

  return res.status(200).json({
    success: true,
    message: 'Notifications fetched successfully!',
    data: {
      docs: result.docs,
      totalDocs: result.totalDocs,
      limit: result.limit,
      totalPages: result.totalPages,
      page: result.page,
      pagingCounter: result.pagingCounter,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
    },
  });
});


const markAsRead = asyncHandler(async (req, res) => {
  const { error, value } = validator.markAsRead.validate(req.body);
  if (error) return response.success(error.details[0].message, null, res);

  const { notificationId } = value;
  const userId = req.user.userId;

  const notification = await NotificationService.markAsRead(notificationId, userId);

  if (!notification) return response.success('Notification not found', null, res);

  return response.success('Notification marked as read', notification, res);
})

const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { error, value } = validator.updateNotificationPreferences.validate(req.body);
  if (error) return response.success(error.details[0].message, null, res);

  const { preferences } = value;
  const userId = req.user.userId;

  const updatedPreferences = await NotificationService.updateNotificationPreferences(userId, preferences);

  return response.success('Notification preferences updated successfully', updatedPreferences, res);
})

const getUserSavedNotificationPreference = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await models.User.findById(userId);
  if (!user) return response.error('User not found', res);

  const preference = user.notificationPreferences.toObject();
  return response.success('User preference found successfully', { preference }, res);
})

export const notificationController = {
  NotificationService,
  getUserSavedNotificationPreference,
  updateNotificationPreferences,
  markAsRead,
  getNotificationsById,
  getNotifications
}
