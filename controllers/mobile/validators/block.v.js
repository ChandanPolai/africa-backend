const joi = require('joi');
const mongoose = require('mongoose');

exports.blockUser = joi.object().keys({
    blockedUserId: joi.string().required()
});

exports.unblockUser = joi.object().keys({
    blockedUserId: joi.string().required(
    )
});

exports.getBlockedUsers = joi.object().keys({
    page:joi.number().optional().default(1),
    limit:joi.number().optional().default(10)
})


