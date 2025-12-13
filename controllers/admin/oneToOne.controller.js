import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
const getAllOneToOne = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, memberId, date, chapter_name, startDate, endDate } = req.query;

  // Conflict check
  if (date && (startDate || endDate)) {
    return response.error("Please provide either 'date' or 'startDate/endDate', not both", res);
  }

  // Build base query
  let matchStage = {};

  const orConditions = [];

  if (search) {
    orConditions.push(
      { meet_place: new RegExp(search, "i") },
      { topics: new RegExp(search, "i") }
    );
  }

  if (memberId) {
    orConditions.push({ memberId1: new mongoose.Types.ObjectId(memberId) });
    orConditions.push({ memberId2: new mongoose.Types.ObjectId(memberId) });
  }

  if (orConditions.length > 0) {
    matchStage.$or = orConditions;
  }

  // Specific date filter (full day)
  if (date) {
    matchStage.date = {
      $gte: new Date(date),
      $lte: new Date(date + "T23:59:59.999Z"),
    };
  }

  // Date range filter
  if (!date && startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + "T23:59:59.999Z"),
    };
  } else if (!date && startDate) {
    matchStage.date = { $gte: new Date(startDate) };
  } else if (!date && endDate) {
    matchStage.date = { $lte: new Date(endDate + "T23:59:59.999Z") };
  }

  // Aggregation pipeline
  const pipeline = [
    { $match: matchStage },

    // Lookup for memberId1
    {
      $lookup: {
        from: "users",
        localField: "memberId1",
        foreignField: "_id",
        as: "memberId1",
      },
    },
    { $unwind: "$memberId1" },

    // Lookup for memberId2
    {
      $lookup: {
        from: "users",
        localField: "memberId2",
        foreignField: "_id",
        as: "memberId2",
      },
    },
    { $unwind: "$memberId2" },

    // Lookup for initiatedBy
    {
      $lookup: {
        from: "users",
        localField: "initiatedBy",
        foreignField: "_id",
        as: "initiatedBy",
      },
    },
    { $unwind: "$initiatedBy" },

    // Chapter filter (on memberId1's chapter)
    ...(chapter_name
      ? [
          {
            $match: {
              "memberId1.chapter_name": new RegExp(chapter_name, "i"),
            },
          },
        ]
      : []),

    // ✅ Sort alphabetically by memberId1 name
    { $sort: { "memberId1.name": 1 } },

    {
      $facet: {
        docs: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await models.OneToOne.aggregate(pipeline);
  const docs = result[0].docs;
  const totalDocs = result[0].totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalDocs / limit);

  const responseData = {
    docs,
    totalDocs,
    limit,
    totalPages,
    page,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  };

  return response.success("One-to-one meetings fetched successfully", responseData, res);
});

export const oneToOneController = {
  getAllOneToOne,
};
