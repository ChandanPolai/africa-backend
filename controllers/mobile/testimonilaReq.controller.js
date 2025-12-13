import { models } from "../../models/zindex.js";
import { notificationController } from "./notification.controller.js";
import asyncHandler from 'express-async-handler';
const getAllTestimonialRequests = asyncHandler(async (req, res) => {
        const requests = await models.TestimonialRequest.find()
            .populate("giverId receiverId", "name email profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: requests });
})

const createTestimonialRequest = asyncHandler(async (req, res) => {
        const { giverId, receiverId, message } = req.body;

        const existing = await models.TestimonialRequest.findOne({ giverId, receiverId });
        if (existing) {
            return res.status(409).json({ error: "You have already receive a testimonial from this user" });
        }   

        const newRequest = new models.TestimonialRequest({
            giverId,
            receiverId,
            message,
            requested: true,
        });

        await newRequest.save();

        const receiver = await models.User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: "Receiver not found" });
        }

        const giver = await models.User.findById(giverId);
        if (!giver) {
            return res.status(404).json({ error: "Receiver not found" });
        }
        // Send notification if receiver has FCM token
        // if (receiver.fcm) {
        //     await sendNotification(
        //         receiver.fcm,
        //         `New Testimonial Request Received!`,
        //         `${giver.name || 'Someone'} has sent you a testimonial request`,
        //     );
        // }

        if (receiver._id && giver._id) {
            await notificationController.NotificationService.createNotification({
                userId: receiver._id,
                triggeredBy: giver._id,
                title: "New Testimonial Request Received!",
                relatedEntity: giver._id, // Add this
                entityType: 'testimonialReq', // Add this
                description: `${giver.name || 'Someone'} has sent you a testimonial request`,
                message: "",
            });
        }
        res.status(201).json({ success: true, message: "Testimonial request created", data: newRequest });
})

const getTestimonialRequestsByReceiverId =asyncHandler( async (req, res) => {
        const { receiverId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const requests = await models.TestimonialRequest.find({ receiverId })
            .populate("giverId", "name email profilePic")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await models.TestimonialRequest.countDocuments({ receiverId });

        res.status(200).json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            data: requests,
        });
})



const updateTestimonialRequest = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await models.TestimonialRequest.findByIdAndUpdate(id, req.body, { new: true });

        if (!updated) return res.status(404).json({ success: false, message: "Request not found" });

        res.status(200).json({ success: true, message: "Request updated", data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error while updating request" });
    }
})

export const testimonialReqController={
    getAllTestimonialRequests,
    createTestimonialRequest,
    getTestimonialRequestsByReceiverId,
    updateTestimonialRequest
}