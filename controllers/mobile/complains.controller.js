import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';



const createComplaint = asyncHandler(async (req, res) => {

    
  let image = "";
  if (req.file && req.file.path) {
    image = req.file.path.replace(/\\/g, "/");
  }

    

        const { userId, title, details, category } = req.body;
       

        const complaint = await models.Complaint.create({
            userId,
            title,
            details,
            category,
            image
        });

        return response.success("Complaint created successfully!", { complaint }, res);
    });


const getComplaints = asyncHandler(async (req, res) => {
    const { userId,  page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (userId) query.userId = userId;
   

    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        // Always populate userId field with User data
        populate: {
          path: 'userId', // This matches your schema field name
          select: 'name email phone chapter_name'
        },
        sort: { createdAt: -1 },
      };
      


    const complaints = await models.Complaint.paginate(query, options);

    return response.success("Complaints fetched successfully!", complaints, res);
});

const getComplaintsByComplaintsId = asyncHandler(async (req, res) => {

    const { complaintId } = req.params;


    const complaint = await models.Complaint.findById(complaintId).populate({ path: 'userId', select: 'name email phone chapter_name' });
    if (!complaint) {
        return response.error("Complaint not found", 404, res);
    }
    return response.success("Complaint fetched successfully!", { complaint }, res);

});

const deleteComplaint = asyncHandler(async (req, res) => {

    const { complaintId } = req.params;
     
    const deletedComplaint = await models.Complaint.findByIdAndDelete(
        complaintId,
        
       
    );  
    if (!deletedComplaint) {
        return response.error("Complaint not found", 404, res);
    }
    return response.success("Complaint deleted successfully!", true, res);


})


const updateComplaintStatus = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    const { status, adminResponse } = req.body;

    const complaint = await models.Complaint.findById(complaintId);
    if (!complaint) {
        return response.error("Complaint not found", 404, res);
    }

    complaint.status = status;
    if (adminResponse) complaint.adminResponse = adminResponse;
    if (status === 'resolved') complaint.resolvedAt = new Date();

    await complaint.save();

    return response.success("Complaint status updated successfully!", { complaint }, res);
});

export const complaintController = {
    createComplaint,
    getComplaints,
    deleteComplaint,
    updateComplaintStatus,
    getComplaintsByComplaintsId
};