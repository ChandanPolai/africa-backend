import asyncHandler from 'express-async-handler';
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';





const getChapters = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
    };

    const chapters = await models.Chapter.paginate(query, options);

    return response.success('Chapter created successfully', chapters, res);
});

const getChapterByCity = asyncHandler(async (req, res) => {

    const { city_name } = req.body;

if(!city_name) {
   return response.requiredField('City name is required', res);
   
}
const chapters = await models.Chapter.find({ city_name });
if (chapters.length === 0) {
    return response.noContent('No chapters found for the specified city', res);
}
    return response.success('Chapters found for the specified city', chapters, res);
});




const getChapterById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const chapter = await models.Chapter.findById(id);

    if (!chapter) {
        return response.success('Chapter not found',null ,res);
    }
    return response.success('Chapter found',chapter, res);
});

// Update Chapter
const createChapter = asyncHandler(async (req, res) => {
    const {
      name,
      city_name,
      status,
      fees: {
        registration_fee = 0, // Default to 0 if undefined
        renewal_fee = 0,
        membership_duration_days = 365,
      } = {}, // Default to empty object if fees is undefined
    } = req.body;
  
    const newChapter = new models.Chapter({
      name,
      city_name,
      status,
      fees: {
        registration_fee,
        renewal_fee,
        membership_duration_days,
      },
    });
  
    await newChapter.save();
  
    return response.create('Chapter created successfully', newChapter, res);
  });
  
  const updateChapter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      city_name,
      status,
      fees: {
        registration_fee = 0,
        renewal_fee = 0,
        membership_duration_days = 365,
      } = {},
    } = req.body;
  
    const updatedChapter = await models.Chapter.findByIdAndUpdate(
      id,
      {
        name,
        city_name,
        status,
        fees: {
          registration_fee,
          renewal_fee,
          membership_duration_days,
        },
      },
      { new: true }
    );
  
    if (!updatedChapter) {
      return response.success('Chapter not found', null, res);
    }
  
    return response.success('Chapter updated successfully', updatedChapter, res);
  });

const deleteChapter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedChapter = await models.Chapter.findByIdAndDelete(id);

    if (!deletedChapter) {
        return response.sucesss('Chapter not found',null ,res);
    }

    return response.success('Chapter deleted successfully',true, res);
});

// Export Controller
export const chapterController = {
    createChapter,
    getChapters,
    getChapterById,
    updateChapter,
    deleteChapter,
    getChapterByCity 

};
