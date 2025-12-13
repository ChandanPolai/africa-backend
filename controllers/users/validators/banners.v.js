const joi = require('joi');

exports.getActiveBanners = joi.object().keys({
    page: joi.number().optional().default(1), // Pagination page
    limit: joi.number().optional().default(10), // Pagination limit
});
