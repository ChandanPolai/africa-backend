const Joi = require('joi');

module.exports = {
    createReport: Joi.object().keys({
       
        reportedItemType: Joi.string().valid('profile', 'feed').required(),
        reportedItemId: Joi.string().required(),
        reason: Joi.string().required(),
        description: Joi.string().allow('').optional()
    }),
    updateReportStatus: Joi.object().keys({
        reportId: Joi.string().required(),
        status: Joi.string().valid('pending', 'reviewed', 'resolved', 'rejected').required(),
        adminComment: Joi.string().allow('').optional()
    }),
    getReports: Joi.object().keys({
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
        status: Joi.string().valid('pending', 'reviewed', 'resolved', 'rejected', 'all').default('all'),
        reportedItemType: Joi.string().valid('profile', 'feed', 'all').default('all')
    })
};