const Joi = require('joi');

exports.getNearbyUsers = Joi.object().keys({
    latitude: Joi.number().required().messages({
        "number.base": "Latitude must be a number!",
        "any.required": "Latitude is required!",
    }),
    longitude: Joi.number().required().messages({
        "number.base": "Longitude must be a number!",
        "any.required": "Longitude is required!",
    }),
    radius: Joi.number().required().messages({
        "number.base": "Radius must be a number!",
        "any.required": "Radius is required!",
    }),
})


