
const Joi = require('joi');


exports.getCouponsForUser = Joi.object().keys({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
});

exports.redeemCoupon = Joi.object().keys({
    couponId: Joi.string().required(),
    userId: Joi.string().required(),
});

exports.markCouponAsScratched = Joi.object().keys({
    couponId: Joi.string().required(),
});