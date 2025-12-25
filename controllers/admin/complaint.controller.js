import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';

// Get all complaints for admin
export const getAllComplaints = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, category, search } = req.query;

    const query = { isActive: true };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { details: { $regex: search, $options: 'i' } }
        ];
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: {
            path: 'userId',
            select: 'name email mobile_number chapter_name profilePic'
        },
        sort: { createdAt: -1 }
    };

    const complaints = await models.Complaint.paginate(query, options);

    return response.success("Complaints fetched successfully!", complaints, res);
});

// Get complaint by ID
export const getComplaintById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const complaint = await models.Complaint.findById(id)
        .populate('userId', 'name email mobile_number chapter_name profilePic');
    
    if (!complaint) {
        return response.error("Complaint not found", 404, res);
    }

    return response.success("Complaint fetched successfully!", { complaint }, res);
});

// Update complaint status
export const updateComplaintStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const complaint = await models.Complaint.findById(id);
    if (!complaint) {
        return response.error("Complaint not found", 404, res);
    }

    if (status) {
        complaint.status = status;
        if (status === 'resolved') {
            complaint.resolvedAt = new Date();
        }
    }
    if (adminResponse !== undefined) {
        complaint.adminResponse = adminResponse;
    }

    await complaint.save();

    return response.success("Complaint status updated successfully!", { complaint }, res);
});

// Delete complaint
export const deleteComplaint = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const complaint = await models.Complaint.findById(id);
    if (!complaint) {
        return response.error("Complaint not found", 404, res);
    }

    // Soft delete by setting isActive to false
    complaint.isActive = false;
    await complaint.save();

    return response.success("Complaint deleted successfully!", true, res);
});

export const complaintAdminController = {
    getAllComplaints,
    getComplaintById,
    updateComplaintStatus,
    deleteComplaint
};

