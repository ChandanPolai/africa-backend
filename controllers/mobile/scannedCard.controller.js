import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
const getScannedCards = async (req, res) => {
  try {
    // const { userId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required", success: false });
    }

    const { search, page, limit } = req.body;
    let searchRegex = new RegExp(search, "i");
    let cards = await models.ScannedBusinessCard.paginate(
      {
        $or: [
          { name: searchRegex },
          { mobile: searchRegex },
          { companyName: searchRegex },
          { companyEmailId: searchRegex },
          { businessMobile: searchRegex },
          { businessType: searchRegex },
          { keywords: searchRegex },
          { notes: searchRegex },
        ],
        userId,
      },
      { page, limit, sort: { _id: -1 }, lean: true }
    );

    if (cards.docs.length == 0) {
      return res
        .status(200)
        .json({ message: "No cards found!", success: true });
    }

    res
      .status(200)
      .json({ message: "Business cards fetched successfully!", cards, success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error while getting scanned cards", success: false });
  }
};

const saveScannedCard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const value=req.body
    if (!userId) {
      return res.status(400).json({ error: "User ID is required", success: false });
    }

      if (req.files && req.files.frontImage) {
        value.frontImage = req.files?.frontImage?.[0]?.path.replace(/\\/g, "/");
      }
      if (req.files && req.files.backImage) {
        value.backImage = req.files?.backImage?.[0]?.path.replace(/\\/g, "/");
      }

      value.userId = userId;
      if (!value._id) {
        delete value._id;
        let record = await models.ScannedBusinessCard.create(value);
        res
          .status(201)
          .json({ message: "Scanned card added!", success: true, record });
      } else {
        let record = await models.ScannedBusinessCard.findByIdAndUpdate(
          value._id,
          value,
          { new: true }
        );
        res
          .status(201)
          .json({ message: "Scanned card updated!", success: true, record });
      }
})

const deleteScannedCard = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Card ID is required" });
    }

    const record = await models.ScannedBusinessCard.findById(id);
    if (!record) {
      return res.status(404).json({ error: "scaned Card not found" });
    }


    await models.ScannedBusinessCard.findByIdAndDelete(id, { new: true });

    res
      .status(200)
      .json({ message: "Card deleted successfully!", success: true, record });
})

export const scannedCardController={
    getScannedCards,
    deleteScannedCard,
    saveScannedCard
}