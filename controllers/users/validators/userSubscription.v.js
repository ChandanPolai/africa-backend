const Joi = require('joi')
exports.subscribeToPlan = Joi.object().keys({
    subscriptionId: Joi.string().required(),
    paymentId: Joi.string().required(), // Payment gateway transaction ID
});

exports.cancelSubscription = Joi.object().keys({
    userSubscriptionId: Joi.string().required(),
});

