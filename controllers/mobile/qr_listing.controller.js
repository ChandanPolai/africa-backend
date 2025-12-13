import { models } from "../../models/zindex.js";
import mongoose from "mongoose";
import asyncHandler from 'express-async-handler';

const addScannedprofile =asyncHandler( async (req, res) => {
    const userId = req.user.userId;
    const { profileId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "User ID is required", success: false });
    }

    let scannedProfile = await models.QRListing.findOne({
      userId,
    });

    if (!scannedProfile) {
      scannedProfile = await models.QRListing.create({
        userId,
        scanned_profiles: [{ profileId }],
      });
    }

    if (scannedProfile.scanned_profiles.length > 0) {
      const existingProfile = scannedProfile.scanned_profiles.find(
        (profile) => profile.profileId == profileId
      );
      if (existingProfile) {
        return res
          .status(200)
          .json({ error: "Profile already scanned", success: false });
      }
    }

    scannedProfile.scanned_profiles.push({ profileId });
    await scannedProfile.save();

    res.status(201).json({ message: "Scanned profile added!", success: true });
})

const getAllScannedProfiles = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    if (!userId) {
      return res
        .status(200)
        .json({ success: false, message: "User ID is required" });
    }

    const { search = "", page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Populate scanned_profiles.profileId
    const profilesData = await models.QRListing
      .findOne({ userId })
      .populate(
        "scanned_profiles.profileId",
        "name profilePic email mobile_number chapter_name"
      );

    if (!profilesData || !profilesData.scanned_profiles.length) {
      return res.status(200).json({
        success: true,
        message: "No scanned profiles found",
        docs: [],
        totalDocs: 0,
        limit: limitNumber,
        page: pageNumber,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }

    let filteredProfiles = profilesData.scanned_profiles.filter((profile) => {
      const name = profile.profileId?.name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    });

    const totalDocs = filteredProfiles.length;
    const totalPages = Math.ceil(totalDocs / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Paginate the filtered data
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = pageNumber * limitNumber;
    const paginatedProfiles = filteredProfiles
      .slice(startIndex, endIndex)
      .map((p) => p.profileId);

    return res.status(200).json({
      success: true,
      message: "scanned users profiles retrieved successfully!",
      docs: paginatedProfiles,
      totalDocs,
      limit: limitNumber,
      page: pageNumber,
      totalPages,
      hasNextPage,
      hasPrevPage,
    });
})

export const qrListingController = {
  addScannedprofile,
  getAllScannedProfiles
}
