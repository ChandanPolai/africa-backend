import { userValdation } from "./validators/users.validator.js";
import { models } from "../../models/zindex.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { response } from "../../utils/response.js";
import { helpers } from "../../utils/helpers.js";
// import { analytics } from "../../config/analytics.js";


const createVisitorAddList = asyncHandler(async (req, res) => {

    const { name, refUserId, mobile_number, email, business_name, notes } = req.body;

    // Validate required fields
    if (!name || !refUserId || !mobile_number) {
        return response.badRequest("Name, refUserId and mobile_number are required", res);
    }

    // Check if the user exists
    const user = await models.User.findById(refUserId);
    if (!user) {
        return response.notFound("User not found", res);
    }

    // Create new visitor add list entry
    const visitorAddListEntry = new models.VisitorAddList({
        name,
        refUserId,
        mobile_number,
        email,
        business_name,
        notes
    });

    await visitorAddListEntry.save();

    return response.create("Visitor added successfully", visitorAddListEntry, res);
}  );

const getVisitorAddList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit)) {
        return response.badRequest("Invalid pagination parameters", res);
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    };

    // Fetch paginated visitor add list entries
    const visitorAddListEntries = await models.VisitorAddList.paginate({}, options);

    return response.success("Visitor add list fetched successfully", visitorAddListEntries, res);
});

const deleteVisitorAddList = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.badRequest("Invalid ID format", res);
    }

    // Find and delete the visitor add list entry
    const deletedEntry = await models.VisitorAddList.findByIdAndDelete(id);

    if (!deletedEntry) {
        return response.notFound("Visitor add list entry not found", res);
    }

    return response.success("Visitor add list entry deleted successfully", deletedEntry, res);
}
);

const updateVisitorAddList = asyncHandler(async (req, res) => {
     const { id } = req.params;
    const { name, refUserId, mobile_number, email, business_name, notes } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.badRequest("Invalid ID format", res);
    }
    // Validate required fields
    if (!name || !refUserId || !mobile_number) {
        return response.badRequest("Name, refUserId and mobile_number are required", res);
    }       
    // Check if the user exists
    const user = await models.User.findById(refUserId);
    if (!user) {
        return response.notFound("User not found", res);
    }
    // Update visitor add list entry
    const updatedEntry = await models.VisitorAddList.findByIdAndUpdate(
        id,
        { name, refUserId, mobile_number, email, business_name, notes },
        { new: true }
    );
    if (!updatedEntry) {
        return response.notFound("Visitor add list entry not found", res);
    }
    return response.success("Visitor add list entry updated successfully", updatedEntry, res);
}
);

export const visitorAddListController = {
    createVisitorAddList,
    getVisitorAddList,
    deleteVisitorAddList,
    updateVisitorAddList
};
