import Joi from 'joi';

const userSchema = Joi.object({
    name: Joi.string().trim().required(),
    profilePic: Joi.string().trim().optional(),
    chapter_name: Joi.string().trim().required(),
    mobile_number: Joi.string().pattern(/^\d{10}$/).required(),
    email: Joi.string().email().required(),
    date_of_birth: Joi.date().iso().required(),
    address: Joi.string().trim().required(),
}).unknown(true);

const businessSchema = Joi.object({
    logo: Joi.string().trim().optional().allow(""),
    banner_image: Joi.string().trim().optional().allow(""),
    primary_business: Joi.boolean().optional(),
    business_name: Joi.string().trim().optional().allow(""),
    business_type: Joi.string().trim().optional().allow(""),
    category: Joi.string().trim().optional().allow(""),
    sub_category: Joi.string().trim().optional().allow(""),
    product: Joi.string().trim().optional().allow(""),
    service: Joi.string().trim().optional().allow(""),
    formation: Joi.string().trim().optional().allow(""),
    establishment: Joi.date().optional().allow(""),
    team_size: Joi.number().optional().allow(""),
    mobile_number: Joi.string().pattern(/^\d{10}$/).optional().allow(""),
    email: Joi.string().email().optional().allow(""),
    website: Joi.string().optional().allow(""),
    address: Joi.string().trim().optional().allow(""),
    team_size: Joi.number().optional().allow(""),
    about_business_details: Joi.string().trim().optional().allow(""),
});

const complaintSchema = Joi.object({
    details: Joi.string().trim().required(),
    giverId: Joi.string().trim().required(),
});

const suggestionSchema = Joi.object({
    details: Joi.string().trim().required(),
});

const registerUserValidator = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().email().trim().lowercase().optional().allow(""),
    mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
    date_of_birth: Joi.date().optional().allow(""),
    chapter_name: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    meeting_role: Joi.string().trim().required(),
    fcm: Joi.string().trim().optional().allow(""),
    keywords: Joi.string().trim().optional().allow(""),
    sponseredBy: Joi.string().trim().optional().allow(""),
});

const getNearbyUsers = Joi.object().keys({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    radius: Joi.number().required(),
    category: Joi.string().optional().allow(""),
})

export const userValdation = { userSchema, businessSchema, complaintSchema, suggestionSchema, registerUserValidator, getNearbyUsers };