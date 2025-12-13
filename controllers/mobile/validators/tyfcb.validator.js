import Joi from "joi";

const tyfcbValidation = Joi.object({
    giverId: Joi.string().trim().required(),
    receiverId: Joi.string().trim().required(),
    referralId: Joi.string().trim(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().trim().required(),
    referral_type: Joi.string().valid("Inside", "Outside", "Tier3+").required(),
    business_type: Joi.string().valid("New", "Repeat").required(),
    comments: Joi.string().trim().allow(""),
});

export const tyfcbValidator= { tyfcbValidation };