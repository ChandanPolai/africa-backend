import Joi from "joi";

const oneToOneValidation = Joi.object({
    memberId1: Joi.string().trim().required(),
    memberId2: Joi.string().trim().required(),
    meet_place: Joi.string().trim().allow(""),
    initiatedBy: Joi.string().trim().allow("", null),
    date: Joi.date().optional().allow(null),
    topics: Joi.string().trim().allow(""),
});

export const oneToOneValidator={
oneToOneValidation
}
