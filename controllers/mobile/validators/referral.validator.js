import Joi from "joi";

const referralValidator = Joi.object({
  giver_id: Joi.string().trim().required(),
  receiver_id: Joi.string().trim().required(),
  referral_type: Joi.string().valid("inside", "outside").required(),
  // Replace nested object with flattened keys
  referral_status: Joi.object({
    told_them_you_would_will: Joi.boolean().required(),
    given_card: Joi.boolean().required(),
  }).required(),
  referral: Joi.string().trim().optional(),
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
  address: Joi.string().trim().optional().allow(""),
  comments: Joi.string().trim().allow(""),
  rating: Joi.number().min(1).max(5).required(),
  business_name: Joi.string().trim().optional().allow(""),
});

export default referralValidator;