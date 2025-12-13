import Joi from "joi";

const attendanceValidation = Joi.object({
    userId: Joi.string().trim().required(),
    eventId: Joi.string().trim().required(),
    event: Joi.alternatives().try(Joi.object(), Joi.string().allow("")).default({}),
});

export const attendanceValidator= { attendanceValidation };
