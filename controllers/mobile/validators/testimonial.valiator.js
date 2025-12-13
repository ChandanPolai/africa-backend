import Joi from "joi";

const testimonialValidation = Joi.object({
    giverId: Joi.string().trim().required(),
    receiverId: Joi.string().trim().required(),
    date: Joi.date().optional(),
    message: Joi.string().trim().required(),
});

export const testimonialValidator= { testimonialValidation };