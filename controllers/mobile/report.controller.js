import { response } from "../../utils/response.js";

import { models } from "../../models/zindex.js";







 const createReport = async (req, res) => {
    try {
       

        const { reportedItemType, reportedItemId, reason, description,reporterId } = req.body;


        
        const reporter = await models.User.findById(reporterId);
        if (!reporter) {
            return response.success("Reporter user not found!", null, res);
        }

        
        let reportedItem;
        if (reportedItemType === 'profile') {
            reportedItem = await models.User.findById(reportedItemId);
        } else if (reportedItemType === 'feed') {
            reportedItem = await models.Feed.findById(reportedItemId);
        }

        if (!reportedItem) {
            return response.success("Reported item not found!", null, res);
        }

    
        const existingReport = await models.reports.findOne({
            reporterId,
            reportedItemType,
            reportedItemId,
            isDeleted: false
        });

        if (existingReport) {
            return response.success("You have already reported this item!", null, res);
        }

       
        const newReport = new models.reports({
            reporterId,
            reportedItemType,
            reportedItemId,
            reason,
            description,
            status: 'pending'
        });

        await newReport.save();

        
        const populatedReport = await models.reports.aggregate([
            { $match: { _id: newReport._id } },
            {
                $lookup: {
                    from: "users",
                    localField: "reporterId",
                    foreignField: "_id",
                    as: "reporter"
                }
            },
            { $unwind: "$reporter" },
            {
                $project: {
                    _id: 1,
                    reporterId: 1,
                    reportedItemType: 1,
                    reportedItemId: 1,
                    reason: 1,
                    description: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "reporter._id": 1,
                    "reporter.name": 1,
                    "reporter.userImage": 1
                }
            }
        ]);

        return response.success("Report submitted successfully!", true, res);
    } catch (err) {
        return response.error(err.message || err,500, res);
    }
};

 const updateReportStatus = async (req, res) => {
    try {
        const { error, value } = validator.updateReportStatus.validate(req.body);
        if (error) {
            return response.success(error.message, null, res);
        }

        const { reportId, status, adminComment } = value;

        
        const report = await models.reports.findById(reportId);
        if (!report) {
            return response.success("Report not found!", null, res);
        }

        
        report.status = status;
        if (adminComment) {
            report.adminComment = adminComment;
        }

        await report.save();

        return response.success("Report status updated successfully!", report, res);
    } catch (err) {
        return response.error(err.message || err, res);
    }
};

 const getReports = async (req, res) => {
    try {
        const { error, value } = validator.getReports.validate(req.body);
        if (error) {
            return response.success(error.message, null, res);
        }

        const { page, limit, status, reportedItemType } = value;
 
        const query = { isDeleted: false };
        
        if (status !== 'all') {
            query.status = status;
        }
        
        if (reportedItemType !== 'all') {
            query.reportedItemType = reportedItemType;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: 'reporterId', select: '_id name userImage' }
            ]
        };

        const reports = await models.reports.paginate(query, options);

        return response.success("Reports fetched successfully!", reports, res);
    } catch (err) {
        return response.error(err.message || err, res);
    }
};

 const getReportDetails = async (req, res) => {
    try {
        const { reportId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return response.success("Invalid report ID!", null, res);
        }

        const report = await models.reports.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(reportId), isDeleted: false } },
            {
                $lookup: {
                    from: "users",
                    localField: "reporterId",
                    foreignField: "_id",
                    as: "reporter"
                }
            },
            { $unwind: "$reporter" },
            {
                $project: {
                    _id: 1,
                    reporterId: 1,
                    reportedItemType: 1,
                    reportedItemId: 1,
                    reason: 1,
                    description: 1,
                    status: 1,
                    adminComment: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "reporter._id": 1,
                    "reporter.name": 1,
                    "reporter.userImage": 1
                }
            }
        ]);

        if (!report || report.length === 0) {
            return response.success("Report not found!", null, res);
        }

        
        let reportedItem;
        if (report[0].reportedItemType === 'profile') {
            reportedItem = await models.users.findById(report[0].reportedItemId)
                .select('_id name userImage businessName isActive isDeleted');
        } else if (report[0].reportedItemType === 'feed') {
            reportedItem = await models.Feed.findById(report[0].reportedItemId)
                .select('_id userId description images isDeleted')
                .populate('userId', '_id name userImage');
        }

        return response.success("Report details fetched successfully!", {
            ...report[0],
            reportedItem
        }, res);
    } catch (err) {
        return response.error(err.message || err, res);
    }
};



export const reportController = {
    createReport,
    updateReportStatus,
    getReports,
    getReportDetails
    
};



