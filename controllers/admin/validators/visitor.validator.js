import Joi from "joi";

const visitorValidation = Joi.object({
    name: Joi.string().trim().required(),
    chapterName: Joi.string().trim().optional(),
    refUserId: Joi.string().trim().required(),
    eventId: Joi.string().trim().required(),
    fees: Joi.number().min(0).allow(""),
    paid: Joi.boolean().default(false),
    mobile_number: Joi.string().trim().required(),
    email: Joi.string().email().trim().allow(""),
    business_name: Joi.string().trim().allow(""),
    business_type: Joi.string().trim().allow(""),
    address: Joi.string().trim().allow(""),
    pincode: Joi.string().trim().allow(""),
});

export const visitorValidator= { visitorValidation };