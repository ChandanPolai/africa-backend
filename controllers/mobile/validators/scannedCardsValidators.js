import Joi from "joi";

const businessCardValidation = Joi.object({
  _id:Joi.string().trim().allow(''),
  name: Joi.string().trim().required(),
  mobile: Joi.string().trim().required(),
  companyEmailId: Joi.string().email().allow(''),
  companyName: Joi.string().trim().allow(''),
  businessMobile: Joi.string().trim().allow(''),
  address: Joi.string().allow("").allow(''),
  keywords: Joi.string().trim().uppercase().allow('').default('Others'),
  notes: Joi.string().allow("").allow(''),
  frontImage: Joi.string().allow(null, '').optional(),
  backImage: Joi.string().allow(null, '').optional(),
  businessType:Joi.string().allow(null, '').optional(),
  website:Joi.string().allow(null, '').optional(),
}).unknown(true);

export const scanCardValidator= {businessCardValidation}
