const Joi = require('joi');

// ======================== Reusable Schemas ========================
const addressSchema = Joi.object({
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('').optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().required()
    
});

const businessReferenceSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    businessName: Joi.string().allow('').optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    email: Joi.string().email().allow('').optional(),
    relationship: Joi.string().allow('').optional()
});

// ======================== Application Validators ========================
const submitMemberApplication = Joi.object({
    chapter: Joi.string().required().default('GBS Drona'),
    region: Joi.string().default('GBS Surat North'),
    invitedBy: Joi.string().required(),
  
    howHeardAbout: Joi.string().required(),
   
    applicant: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        companyName: Joi.string().required(),
        industry: Joi.string().required(),
        professionalClassification: Joi.string().required(),
        businessAddress: addressSchema.default(),
        email: Joi.string().email().required(),
        businessWebsite: Joi.string().allow('').optional(),
        mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
        adhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),
        secondaryPhone: Joi.string().pattern(/^[0-9]{10}$/).allow('').optional(),
        gstNumber: Joi.string().allow('').optional()
    }),
   
    
    gbsHistory: Joi.object({
        previousMember: Joi.string().valid('Yes', 'No').required(),
        otherNetworkingOrgs: Joi.string().valid('Yes', 'No').required()
    }),
    references: Joi.object({
        reference1: businessReferenceSchema.required(),
        reference2: businessReferenceSchema.required(),
        informedReferences: Joi.boolean().required().default(false)
    }),
    termsAccepted: Joi.boolean().required().default(false),
    isDeleted: Joi.boolean().optional().default(false)
});

const submitRenewalApplication = Joi.object({
    chapter: Joi.string().required().default('GBS Drona'),
    region: Joi.string().default('GBS Surat North'),
    applicant: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        businessName: Joi.string().allow('').optional(),
        businessAddress: addressSchema.required(),
        website: Joi.string().allow('').optional(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
        gbsCategory: Joi.string().required(),
        adhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).required(),
        gstNumber: Joi.string()
        .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .allow('')
        .optional()
        .messages({
          'string.pattern.base': 'GST number must be a valid 15-character Indian GSTIN (e.g., 24ABCDE1234F1Z5)',
          'string.empty': 'GST number can be empty',
        }),
    }),
    applicationDate: Joi.date().required(),
    membershipOption: Joi.string().valid('One Year', 'Two Year', 'Five Year').required(),
    commitment: Joi.object({
        licenseRevoked: Joi.string().valid('Yes', 'No', 'N/A').required(),
        abideByRules: Joi.string().valid('Yes', 'No').required(),
        newNetworkingOrgs: Joi.string().valid('Yes', 'No').required()
    }),
    termsAccepted: Joi.boolean().required().default(false),
    isDeleted: Joi.boolean().optional().default(false)
});

const getActiveApplications = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(10),
    type: Joi.string().valid('member', 'renewal', 'all').optional().default('all')
});

// ======================== Module Export ========================
module.exports = {
    submitMemberApplication,
    submitRenewalApplication,
    getActiveApplications
};