import jwt from 'jsonwebtoken';
import admin from '../config/firebase.js';
import { models } from '../models/zindex.js';

const generateToken = (user) => {
  if (!user || !user._id) {
    throw new Error("User ID is required to generate a token");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degree) => degree * (Math.PI / 180);
  const R = 6371; // Radius of the Earth in km

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  return distance;
};

const sendNotification = async (fcmToken, notificationData) => {
  if (!fcmToken) {
    console.log("FCM token is missing. Skipping notification.");
    return;
  }

  const message = {
    token: fcmToken,
    notification: {
      title: notificationData.title, // Should be a string
      body: notificationData.body    // Should be a string
    },
    data: notificationData.data || {} // Custom data payload
  };

  try {
    console.log("Sending notification with message:", message);
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const helpers = {
  generateToken,
  calculateDistance,
  sendNotification
}
