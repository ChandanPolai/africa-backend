import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';

const createBanner = asyncHandler(async (req, res) => {
    

    const { 
        title, 
        description, 
        redirectUrl, 
        contact, 
        fromDate, 
        toDate, 
        isActive 
    } = req.body;

    let image = '';
    if (req.file) {
        image = req.file.path.replace(/\\/g, '/');
    }

    const banner = await models.Banner.create({
       
        title,
        description,
        image,
        redirectUrl,
        contact,
        fromDate: fromDate ? new Date(fromDate) : null,
        toDate: toDate ? new Date(toDate) : null,
        isActive: isActive !== undefined ? isActive : true
    });

    return response.success("Banner created successfully!", { banner }, res);
});

const getBanners = asyncHandler(async (req, res) => {
 


    
   // if (isActive !== undefined) query.isActive = isActive === 'true';

    const banners = await models.Banner.find().sort({ createdAt: -1 })
       

    const total = await models.Banner.countDocuments();

    return response.success("Banners fetched successfully!", { 
        banners, 
        total,
      
    }, res);
});

const getActiveBanners = asyncHandler(async (req, res) => {
    const banners = await models.Banner.find({ isActive: true }).sort({ createdAt: -1 });

    if (banners.length === 0) {
        return response.notFound("No active banners found!", res);
    }

    return response.success("Active banners fetched successfully!", { banners }, res);
});

const getBannerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const banner = await models.Banner.findById(id).populate('userId', 'name email');
    if (!banner) {
        return response.notFound("Banner not found!", res);
    }

    return response.success("Banner fetched successfully!", { banner }, res);
});

// const updateBanner = asyncHandler(async (req, res) => {
   

   
   

//     const { 
//         id,
//         title, 
//         description, 
//         redirectUrl, 
//         contact, 
//         fromDate, 
//         toDate, 
//         isActive 
//     } = req.body;



//     const banner = await models.Banner.findById(id);
//     if (!banner) {
//         return response.notFound("Banner not found!", res);
//     }


//     let image = banner.image;
//     if (req.file) {
//         image = req.file.path.replace(/\\/g, '/');
//     }

//     console.log("Updating banner with ID:", req.body);

//     const updatedBanner = await models.Banner.findByIdAndUpdate(id, {
//         title,
//         description,
//         image,
//         redirectUrl,
//         contact,
//         fromDate: fromDate ? new Date(fromDate) : banner.fromDate,
//         toDate: toDate ? new Date(toDate) : banner.toDate,
//         isActive: isActive !== undefined ? isActive : banner.isActive
//     }, { new: true });

//     return response.success("Banner updated successfully!", { banner: updatedBanner }, res);
// });

const updateBanner = asyncHandler(async (req, res) => {
   

const { 
        id,
        title, 
        description, 
        redirectUrl, 
        contact, 
        fromDate, 
        toDate, 
        isActive 
    } = req.body;



    const banner = await models.Banner.findById(id);
    if (!banner) {
        return response.notFound("Banner not found!", res);
    }


    let image = banner.image;
    if (req.file) {
        image = req.file.path.replace(/\\/g, '/');
    }

    console.log("Updating banner with ID:", req.body);

    const updatedBanner = await models.Banner.findByIdAndUpdate(id, {
        title,
        description,
        image,
        redirectUrl,
        contact,
        fromDate: fromDate ? new Date(fromDate) : banner.fromDate,
        toDate: toDate ? new Date(toDate) : banner.toDate,
        isActive: isActive !== undefined ? isActive : banner.isActive
    }, { new: true });

    return response.success("Banner updated successfully!", { banner: updatedBanner }, res);
});

const deleteBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
  

    const banner = await models.Banner.findById(id);
    if (!banner) {
        return response.notFound("Banner not found!", res);
    }

    // Check if the user is the owner of the banner
  
    await models.Banner.findByIdAndDelete(id);

    return response.success("Banner deleted successfully!", null, res);
});

export const bannerController = {
    createBanner,
    getBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
    getActiveBanners
};