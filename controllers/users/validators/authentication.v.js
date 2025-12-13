const Joi = require('joi');

// ======================== Auth Validators ========================
const signUp = Joi.object({
    name: Joi.string().trim().required(),
    businessName: Joi.string().trim().uppercase(),
    emailId: Joi.string().trim().lowercase().email().allow('').optional(),
    userType: Joi.string().trim().required(),
    mobileNo: Joi.string().required(),
    latitude: Joi.string().optional().allow(''),
    longitude: Joi.string().optional().allow(''),
    referralCode: Joi.string().optional(),
    subcategories: Joi.array().items(Joi.string().trim()).optional(),
    fcm: Joi.string().optional(),
    deviceId: Joi.string().optional(),
    gstin: Joi.string().required(),
    address: Joi.string().required(),
});

const signIn = Joi.object({
    mobileNo: Joi.string().required(),
    fcm: Joi.string().allow('').optional(),
    deviceId: Joi.string().optional(),

});

const updateUser = Joi.object({
    name: Joi.string().allow('').optional(),
    businessName: Joi.string().allow('').optional(),
    emailId: Joi.string().email().allow('').optional(),
    mobileNo: Joi.string().optional(),
    userType: Joi.string().optional(),
    subcategories: Joi.alternatives().try(
        Joi.string(), 
        Joi.array().items(Joi.string()) 
    ).optional(),
    address: Joi.string().allow('').optional(),
    latitude: Joi.string().allow('').optional(),
    longitude: Joi.string().allow('').optional(),
    gstin: Joi.string().allow('').optional(),
    material: Joi.string().allow('').optional(),
    specializedProducts: Joi.string().allow('').optional(),
    description: Joi.string().allow('').optional(),
    minimumValue: Joi.number().optional().default(0),
    businessDescription: Joi.string().allow('').optional(),
    logo: Joi.string().allow('').optional(),
    banner: Joi.string().allow('').optional(),
    fcm: Joi.string().allow('').optional(),
    userImage: Joi.string().allow('').optional()
});

// ======================== User Fetch Validators ========================
const getUserDetailsByMobileNo = Joi.object({
    mobileNo: Joi.string().required()
});

const getUserDetailByUserId = Joi.object({
    userId: Joi.string().required()
});

// ======================== List Users Validators ========================
const getAllWeavers = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10)
});

const getAllValueAddition = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10)
});

const getAllBuyers = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10)
});

const getAllTraders = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10)
});

const getAllBrokers = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10)
});

// ======================== Subcategory Validators ========================
const createSubcategory = Joi.object({
    key: Joi.string().required().trim(),
    value: Joi.string().required().trim(),
    description: Joi.string().optional().allow('').trim()
});

const createMultipleSubcategories = Joi.object({
    subcategories: Joi.array().items(
        Joi.object({
            key: Joi.string().required().trim(),
            value: Joi.string().required().trim(),
            description: Joi.string().optional().allow('').trim()
        })
    ).min(1).required()
});

const updateSubcategory = Joi.object({
    key: Joi.string().required().trim(),
    value: Joi.string().optional().trim(),
    description: Joi.string().optional().allow('').trim(),
    isActive: Joi.boolean().optional()
});

// ======================== Advanced Search ========================
const advancedSearchUsers = Joi.object({
    search: Joi.string().trim().default(''),
    userType: Joi.array().items(
        Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId')
    ).default([]),
    subcategories: Joi.array().items(
        Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId')
    ).default([]),
    minimumValue: Joi.number().min(0).default(0),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

// ======================== OTP Validators ========================
const sendOTP = Joi.object({
    mobileNo: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'Mobile number must be 10 digits',
            'any.required': 'Mobile number is required'
        })
});

const verifyOTP = Joi.object({
    mobileNo: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'Mobile number must be 10 digits',
            'any.required': 'Mobile number is required'
        }),
    otpCode: Joi.string()
        .pattern(/^[0-9]{4}$/)
        .required()
        .messages({
            'string.pattern.base': 'OTP must be 4 digits',
            'any.required': 'OTP is required'
        }),
        deviceId:Joi.string().default(''),
        fcm: Joi.string().default('')

});

const resendOTP = Joi.object({
    mobileNo: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'Mobile number must be 10 digits',
            'any.required': 'Mobile number is required'
        })
});

// Export all validators
module.exports = {
    signUp,
    signIn,
    updateUser,
    getUserDetailsByMobileNo,
    getUserDetailByUserId,
    getAllWeavers,
    getAllValueAddition,
    getAllBuyers,
    getAllTraders,
    getAllBrokers,
    createSubcategory,
    createMultipleSubcategories,
    updateSubcategory,
    advancedSearchUsers,
    sendOTP,
    verifyOTP,
    resendOTP
};