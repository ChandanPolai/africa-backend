import Joi from "joi";
const testimonialRequestSchema = Joi.object({
    giverId: Joi.string().required(),

    receiverId: Joi.string().required(),

    message: Joi.string().allow("").optional(),

    requested: Joi.boolean().default(true),
});

export const testimonialRequestvalidator= { testimonialRequestSchema };