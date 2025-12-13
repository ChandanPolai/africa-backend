const encryptor = require('../../../core/encryptor');
const models = require('../../../models/zindex');
const response = require('../../../core/response');
const helper = require('../../../core/helper');

const verifyToken = require('../../../middleware/authentication');
const { uploader } = require('../../../middleware/files');
const fs = require('fs');
const validator = require('./../validators/form.v');
exports.getActiveSubscriptions = async (req, res) => {
    try {
        

        const subscriptions = await models.subscriptions.find({ isActive: true })
            

        const totalSubscriptions = await models.subscriptions.countDocuments({ isActive: true });

        return response.success("Active subscriptions fetched successfully!", {
            subscriptions,
            totalSubscriptions,
            
        }, res);
    } catch (err) {
        console.error("Error in getActiveSubscriptions:", err);
        return response.error(err, res);
    }
};
exports.subscribeToPlan = async (req, res) => {
    try {
        const { error, value } = validator.subscribeToPlan.validate(req.body);
        if (error) {
            return response.success(error.details[0].message, null, res);
        }

        const { subscriptionId, paymentId } = value;
        const userId = req.token.userId;

        // Step 1: Check if the subscription plan exists
        const subscription = await models.subscriptions.findById(subscriptionId);
        if (!subscription) {
            return response.success("Subscription plan not found!", null, res);
        }

        // Step 2: Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + subscription.duration);

        const userSubscription = await models.userSubscriptions.create({
            subscription: subscriptionId,
            userId,
            expiryDate,
            paymentId,
            paymentStatus: 'completed', 
        });

        return response.success("Subscribed to plan successfully!", { userSubscription }, res);
    } catch (err) {
        console.error("Error in subscribeToPlan:", err);
        return response.error(err, res);
    }
};

exports.cancelSubscription = async (req, res) => {
    try {
        const { error, value } = validator.cancelSubscription.validate(req.body);
        if (error) {
            return response.success(error.details[0].message, null, res);
        }

        const { userSubscriptionId } = value;
        const userId = req.token.userId;

        const userSubscription = await models.userSubscriptions.findOneAndUpdate(
            { _id: userSubscriptionId, userId },
            { isCancelled: true },
            { new: true }
        );

        if (!userSubscription) {
            return response.success("User subscription not found or unauthorized!", null, res);
        }

        return response.success("Subscription cancelled successfully!", { userSubscription }, res);
    } catch (err) {
        console.error("Error in cancelSubscription:", err);
        return response.error(err, res);
    }
};

exports.getUserSubscription = async (req, res) => {
    try {
        const userId = req.token.userId;

        const userSubscription = await models.userSubscriptions.findOne({ userId, isCancelled: false })
            .populate({
                path:'subscription',
                select: 'name description amount duration type features',
            }) // Populate subscription details
            .sort({ createdAt: -1 });

        if (!userSubscription) {
            return response.success("No active subscription found!", null, res);
        }

        return response.success("User subscription fetched successfully!", { userSubscription }, res);
    } catch (err) {
        console.error("Error in getUserSubscription:", err);
        return response.error(err, res);
    }
};