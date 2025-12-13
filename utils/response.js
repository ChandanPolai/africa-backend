import ApiError from "./apiError.js";

const codes = {
    success: 200,
    resourceNotAvailable: 404,
    forbidden: 403,
    unAuthrorized: 401,   
    noContent:204,  //data not found like user 
    internalServerError: 500,
    requiredField:400,  //all fields are required
    conflict:409,   //already exist
    created:201
};

const success = (message, data, response) => {
    return response.status(codes.success).json({
        message: message || "Executed successfully!",
        data: data,
        status: codes.success,
        success:true
    });
};

const create = (message, data, response) => {
    return response.status(codes.created).json({
        message: message || "Created successfully!",
        data: data,
        status: codes.created,
        success:true
    });
};

const noContent = (message, response) => {
    return response.status(codes.noContent).json({
        message: message || "No Data found",
        data: null,
        status: codes.created,
        success:false
    });
};

const conflict = (message,response) => {
    const err = new ApiError(codes.conflict, message || "already exist");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        errors: err.errors,
        success: err.success,
    });
};

const requiredField = (message,response) => {
    const err = new ApiError(codes.requiredField, message || "field are required");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        errors: err.errors,
        success: err.success,
    });
};

const notFound = (message,response) => {
    const err = new ApiError(codes.resourceNotAvailable, message || "Resource Not Available!");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        errors: err.errors,
        success: err.success,
    });
};
 
const forbidden = (message,response) => {
    const err = new ApiError(codes.forbidden, message || "Access forbidden!");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        errors: err.errors,
        success: err.success,
    });
};
const error = (message,statusCode, response) => {  
    const err = new ApiError(codes.internalServerError, message || "Internal server Error");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        statusCode: err.statusCode,
        errors: err.errors,
        success: err.success,
    });
}

const unauthorized = (message,response) => {
    const err = new ApiError(codes.unAuthrorized, message || "UnAuthorized user!");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        errors: err.errors,
        success: err.success,
    });
};

const serverError = (response) => {
    const err = new ApiError(codes.serverError, message = "Internal server Error");
    return response.status(err.statusCode).json({
        message: err.message,
        data: err.data,
        errors: err.errors,
        success: err.success,
    });
};

export const response = {
    success,
    error,
    noContent,
    notFound,
    forbidden,
    unauthorized,
    serverError,
    conflict,
    requiredField,
    create
  };