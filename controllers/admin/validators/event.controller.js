
import Joi from "joi";

const eventValidationSchema = Joi.object({
    name: Joi.string().trim().required(),
    paid: Joi.boolean().required(),
    date: Joi.date().required(),
    event_or_meeting: Joi.string().trim().required(),
    details: Joi.string().trim().allow(""),
    thumbnail: Joi.string().trim().allow(""),
    startTime: Joi.string().trim().allow(""),   
    amount: Joi.number().min(0).default(0).allow(""),
    endTime: Joi.string().trim().allow(""),
    mode: Joi.string().valid("online", "offline").default("offline"),
    photos: Joi.array().items(Joi.string().trim()).default([]),
    videos: Joi.array().items(Joi.string().trim()).default([]),
    mapURL: Joi.string().trim().allow(""),
    location: Joi.string().trim().required(),
    chapter_name: Joi.string().trim().required(),
    eventId: Joi.string().trim().optional(), // For update operation
});

export const eventValidator= { eventValidationSchema };