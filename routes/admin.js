

//users apis
import express from 'express';
const router = express.Router();
import authMiddleware from '../middlewares/auth.middleware.js';
import { userController } from '../controllers/admin/user.controller.js';
import { countryController } from '../controllers/admin/country.controller.js';
import { stateController } from '../controllers/admin/state.controller.js';
import { getCountController } from '../controllers/admin/getCount.controller.js';
import { eventController } from '../controllers/admin/event.controller.js';
import { attendanceController } from '../controllers/admin/attendance.controller.js';

import { ContactUsController } from '../controllers/admin/contactUs.controller.js';
import { feesController } from '../controllers/admin/fee.controller.js';
import { podcastAdminController } from '../controllers/admin/podcastAdmin.controller.js';

import { analyticsController } from '../controllers/admin/analytics.controller.js';






import createUploadMiddleware from '../middlewares/fileUploader.js';
import { chapterController } from '../controllers/admin/chapter.controller.js';
import { categoryController } from '../controllers/admin/categories.controller.js';
import { imageCategoryController } from '../controllers/admin/imageCategory.controller.js';
import { SubCategoryController } from '../controllers/admin/subcategory.controller.js';
import { ProductServiceController } from '../controllers/admin/product_service.controller.js';
import { cityController } from '../controllers/admin/city.controller.js';
import { leaderboardController } from '../controllers/admin/leaderboard.controller.js';
import { referralController } from '../controllers/admin/referral.controller.js';
import { testimonialController } from '../controllers/admin/testimonial.controller.js';
import { oneToOneController } from '../controllers/admin/oneToOne.controller.js';
import {chapterFinanceController} from '../controllers/admin/chapterFinanceController.js'
import { tyfcbController } from '../controllers/admin/tyfcb.controller.js';
import { authController } from '../controllers/admin/auth.controller.js';
import { visitorController } from '../controllers/admin/visitor.controller.js';
//import { badgeController} from '../controllers/admin/badge.controllers.js';

import validator from '../middlewares/validator.middleware.js';
import { eventValidator } from '../controllers/admin/validators/event.controller.js';
import { postController } from '../controllers/admin/post.controller.js';
import { postValidator } from '../controllers/admin/validators/post.validator.js';
import { attendanceValidator } from '../controllers/admin/validators/attendance.validator.js';
import { visitorValidator } from '../controllers/admin/validators/visitor.validator.js'
import { bannerController } from '../controllers/admin/banner.controller.js';
import { badgeController } from '../controllers/admin/badge.controllers.js';
import { podcastController } from '../controllers/admin/podcaster.controller.js';
import { slotController } from '../controllers/admin/slot.controller.js';
// import {analyticsController} from '../controllers/admin/analytics.controller.js';

import {podcastBookingController} from '../controllers/admin/booking.controller.js';
import { complaintAdminController } from '../controllers/admin/complaint.controller.js';
import { suggestionAdminController } from '../controllers/admin/suggestion.controller.js';
const contactUsImageUploader = createUploadMiddleware('contactUsImages');
const userUpload = createUploadMiddleware("User").single('profilePic');
const podcastImageUploader = createUploadMiddleware('podcastImages');




const registerImageUploader = createUploadMiddleware('registerImages');


const bannerImageUploader = createUploadMiddleware('bannerImages');

const recieptImageUploader = createUploadMiddleware('receiptImages');

// Create banner
router.post('/bannerCreate', authMiddleware, bannerImageUploader.single('image'), bannerController.createBanner
);


// Get all banners
router.get('/getAllBanner', authMiddleware, bannerController.getBanners);

// Get single banner
router.get(
    'banners/:id',
    bannerController.getBannerById
);
router.get('/activeBanner', authMiddleware, bannerController.getActiveBanners)
// Update banner
router.post('/bannerUpdate', authMiddleware, bannerImageUploader.single('image'), bannerController.updateBanner
);

// Delete banner
router.delete('/bannerdelete/:id',

    authMiddleware, bannerController.deleteBanner
);

router.post('/createSocialMedia', authController.createSocialMedia);
router.put('/updateSocialMedia/:id', authController.updateSocialMedia);
router.delete('/deleteSocialMedia/:id', authController.deleteSocialMedia);
router.get('/getAllSocialMedia', authController.getAllSocialMedia);


router.post("/createAdmin",  authController.createAdmin);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/VerifyCode", authController.VerifyCode)
router.post("/getMembersForWhatsAppMessage", authController.getMembersForWhatsAppMessage);

router.put('/convert-to-user/:id', authMiddleware, authController.convertMemberToUser);
router.get('/getOtpRecords', authMiddleware, authController.getOtpRecords);


router.get('/podcastById/:id', podcastController.podcastById);
router.get('/getSlotbyPodcastId/:podcastId', podcastAdminController.getSlotbyPodcastId);
router.get('/deleteSlot/:id', podcastAdminController.deleteSlot);
router.post('/bulkDeleteSlots', podcastAdminController.bulkDeleteSlots); 
router.post('/bookingByPodcastId/:podcastId', podcastBookingController.bookingByPodcastId); // Get bookings by podcast ID
router.get('/bookingByPodcastId', podcastBookingController.bookingByPodcastId);

// Bulk delete slots by IDs

//auth apis
router.post("/login", authController.loginAdmin);
router.post("/register", userUpload, authController.registerUser);
router.post("/createAdmin", authController.createAdmin);
router.post("/Feeupdate", authController.updateFee);
router.post("/getAllFeesUsers", authController.getAllFeesUsers);
router.post("/userListByParticularChapter", authController.userListByParticularChapter);



//users apis
router.get("/users", authMiddleware, userController.getAllUsers);
router.get('/:id/pdf', userController.generateUserPDF);
//router.get('/pdf/:id', userController.generateMemberApplicationPDF)
router.get('/generateBulkMemberApplicationsPDF',userController.generateBulkMemberApplicationsPDF )

router.post('/import', userController.upload.single('file'), userController.importUsersFromExcel);

router.post('/importOneToOneFromExcel', userController.upload.single('file'), userController.importOneToOneFromExcel);
router.post('/importReferralsFromExcel', userController.upload.single('file'), userController.importReferralsFromExcel);
router.post('/importTyfcbFromExcel', userController.upload.single('file'), userController.importTyfcbFromExcel);



router.delete("/users/delete/:id", userController.deleteUser);
router.put("/updateUser/:id", userController.updateUser);
router.post("/isActiveStatus", userController.isActiveStatus);

router.post('/getAllContactUs', authMiddleware, ContactUsController.createContactUs);
router.post('/createContactUs', contactUsImageUploader.single('image'), ContactUsController.createContactUs);
router.put('/updateContactUs/:id', contactUsImageUploader.single('image'), ContactUsController.updateContactUs);
router.get('/getAllContactUs', ContactUsController.getAllContactUs);
router.post("/createvisitor", attendanceController.createVisitor);
router.post("/createScanVisitor", eventController.createScanVisitor);
router.get("/getUsersByEventId", eventController.getUsersByEventId);

//countries
router.get("/getAllCountries", countryController.getAllCountries);
router.post("/createCountry", countryController.createCountry);
router.delete("/deleteCountry/:id", countryController.deleteCountry);
router.get("/getCountryById/:id", countryController.getCountryById);
router.put("/updateCountry/:id", countryController.updateCountry);
router.put("/updateTyfcb/:id", tyfcbController.updateTyfcb);
router.delete("/deleteTyfcb/:id", tyfcbController.deleteTyfcb); // Delete TYFCB by ID

//state apis 
router.get("/getAllStates", stateController.getAllStates);
router.post("/createState", stateController.createState);
router.get("/getStateById/:id", stateController.getStateById);
router.put("/updateState/:id", stateController.updateState);
router.delete("/deleteState/:id", stateController.deleteState);


   
router.get("/getAnalyticsByDateRange", analyticsController.getAnalyticsByDateRange);
router.post('/getDailyAnalytics', analyticsController.getDailyAnalytics);
router.post('/getAnalyticsSummary', analyticsController.getAnalyticsSummary);
router.post("/getAnalyticsByDateRange", analyticsController.getAnalyticsByDateRange);






router.get("/getUpcomingPodcasts",podcastController.getUpcomingPodcasts);

router.post('/createPodcast', podcastImageUploader.single('image'), podcastController.createPodcast);
//router.put('/updatePodcast/:id', podcastImageUploader.single('image'), podcastController.updatePodcast);
router.post('/generateSlots', podcastController.generateSlots);
router.get('/bookingByPodcastId/:podcastId', podcastBookingController.bookingByPodcastId);
router.get('/getAvailableSlots', slotController.getAvailableSlots);
router.post('/requestBooking', podcastBookingController.requestBooking);
router.get('/getAllPodcasts', podcastController.getAllPodcasts);
router.put('/updatePodcast/:id', podcastImageUploader.single('image'), podcastController.updatePodcast);
router.delete('/deletePodcast/:id', podcastController.deletePodcast);

router.get('/getAllSlots', slotController.getAllSlots);
router.put  ('/updateSlot/:id', slotController.updateSlot);
router.delete('/deleteSlot/:id', slotController.deleteSlot);
router.post('/statusUpdateBooking', podcastBookingController.processBooking); // Update booking status
router.post('/bulkDeleteSlots', slotController.bulkDeleteSlots); // Bulk delete slots by IDs
router.get('/getAllBookingsByUserId/:userId',podcastBookingController.getAllBookingsByUserId); 
router.get('/getCompletedBookingStats/:userId', podcastBookingController.getCompletedBookingStats); // Get completed booking stats for a user

// Delete slots by IDs

//get counts
router.get('/getdata/counts', getCountController.getDataCounts);
router.post('/getCountsByChapter', getCountController.getCountsByChapter)

//events
router.get("/getAllEvents", eventController.getAllEvents);

const upload = createUploadMiddleware("Event-images-videos");
const badgeImageUploader = createUploadMiddleware("Badge-images");
router.post("/createEvent", upload.single("thumbnail"), validator(eventValidator.eventValidationSchema), eventController.createEvent);
router.delete("/deleteEvent/:eventId", eventController.deleteEvent);
router.post("/events/:eventId/photos", upload.array("photos"), eventController.addPhotos);
router.post("/events/:eventId/videos", upload.array("videos"), eventController.addVideos);
router.post("/getEventGallery", eventController.getEventGallery);
router.post("/updateEvent", upload.single("thumbnail"), validator(eventValidator.eventValidationSchema), eventController.updateEvent);
router.get("/getAllAttendance", eventController.getAllAttendance);
router.delete("/deleteAttendance/:attendanceId", eventController.deleteAttendance);
router.get("/getAllAttendance", eventController.getAllAttendance);
router.get("/getAttendanceRecords", attendanceController.getAttendanceRecords);
router.get("/getEventByChapter/:chapter_name", eventController.eventByChapter);
router.post("/toggleAttendanceStatus", attendanceController.toggleAttendanceStatus);
//chapter apis
router.post("/createChapter", chapterController.createChapter);
router.get("/getChapters", chapterController.getChapters);
router.post("/getChapterByCity", chapterController.getChapterByCity);

router.get("/getChapterById/:id", chapterController.getChapterById);
router.put("/updateChapter/:id", chapterController.updateChapter);// remaining for testing
router.delete("/deleteChapter/:id", chapterController.deleteChapter);// remaining for testing

//categories apis
router.post("/createCategory", categoryController.createCategory);
router.get("/getCategories", categoryController.getCategories);
router.get("/getCategoryById/:id", categoryController.getCategoryById);
router.put("/updateCategory/:id", categoryController.updateCategory);// remaining for testing
router.delete("/deleteCategory/:id", categoryController.deleteCategory);

//image categories apis (with links)
router.post("/createImageCategory", authMiddleware, imageCategoryController.createImageCategory);
router.get("/getImageCategories", authMiddleware, imageCategoryController.getImageCategories);
router.get("/getImageCategoryById/:id", authMiddleware, imageCategoryController.getImageCategoryById);
router.put("/updateImageCategory/:id", authMiddleware, imageCategoryController.updateImageCategory);
router.delete("/deleteImageCategory/:id", authMiddleware, imageCategoryController.deleteImageCategory);
router.post("/addLinkToCategory/:id", authMiddleware, imageCategoryController.addLinkToCategory);
router.put("/updateLinkInCategory/:id/:linkId", authMiddleware, imageCategoryController.updateLinkInCategory);
router.delete("/deleteLinkFromCategory/:id/:linkId", authMiddleware, imageCategoryController.deleteLinkFromCategory);

//categories apis
router.post("/createSubCategory", SubCategoryController.createSubCategory);
router.get("/getSubCategories", SubCategoryController.getSubCategories);
router.get("/getSubCategoryById/:id", SubCategoryController.getSubCategoryById);
router.put("/updateSubCategory/:id", SubCategoryController.updateSubCategory);// remaining for testing
router.delete("/deleteSubCategory/:id", SubCategoryController.deleteSubCategory);

router.post("/createProductService", authMiddleware, ProductServiceController.createProductService);
router.get("/getProductServices",  ProductServiceController.getProductServices);
router.get("/getProductServiceById/:id", ProductServiceController.getProductServiceById);
router.put("/updateProductService/:id", ProductServiceController.updateProductService);// remaining for testing
router.delete("/deleteProductService/:id", ProductServiceController.deleteProductService);

//city apis
router.post("/createCity", authMiddleware, cityController.createCity);
router.get("/getCities", cityController.getCities);
router.get("/getCityById/:id", cityController.getCityById);
router.put("/updateCity/:id", cityController.updateCity);// remaining for testing
router.delete("/deleteCity/:id", cityController.deleteCity);// remaining for testing

//leaderboard apis
router.post("/createLeaderboard", leaderboardController.createLeaderboard);
router.get("/getAllLeaderboards", leaderboardController.getAllLeaderboards);
router.get("/getLeaderboardById/:id", leaderboardController.getLeaderboardById);
router.put("/updateLeaderboard/:id", leaderboardController.updateLeaderboard);// remaining for testing
router.delete("/deleteLeaderboard/:id", leaderboardController.deleteLeaderboard);// remaining for testing
router.get("/getPointsHistory", leaderboardController.getPointsHistory);
router.post("/getAllPointsHistory", leaderboardController.getAllPointsHistory);

//referral
router.get("/referrals", authMiddleware, referralController.getAllReferrals);
router.get("/referrals/received", referralController.getAllReferralsRecieved);
router.get("/referrals/given/:userId", referralController.getReferralsGivenByUser);
router.get("/referrals/received/:userId", referralController.getReferralsReceivedByUser);
router.post("/createTyfcb", tyfcbController.createTyfcb);

router.post('/addCollection', chapterFinanceController.addCollection);
router.post('/add-expense', recieptImageUploader.single('receipt'), chapterFinanceController.addExpense);
router.post('/update-expense', recieptImageUploader.single('receipt'),   chapterFinanceController.updateExpense);
router.post('/delete-expense', chapterFinanceController.deleteExpense);
router.post('/getExpenseById', chapterFinanceController.getExpenseById);
router.post('/getOverallFinanceSummary', chapterFinanceController.getOverallFinanceSummary)

router.post('/getCollectionHistory', chapterFinanceController.getCollectionHistory);
router.post('/removeLastCollection', chapterFinanceController.removeLastCollection);
router.post('/getChapterFinanceSummary', chapterFinanceController.getChapterFinanceSummary);


//testimonial
router.get("/testimonials", authMiddleware, testimonialController.getAllTestimonials);
router.get("/testimonials/received/:receiverId/selected", testimonialController.getTestimonialsByReceiverIdWithSelected);

//oneToOne
router.get("/oneToOnes/getAllOneToOne", authMiddleware, oneToOneController.getAllOneToOne);

//tyfcb
router.get("/getAllTyfcb", authMiddleware, tyfcbController.getAllTyfcb);
router.post('/getUserTyfcbSummary', tyfcbController.getUserTyfcbSummary);
router.post('/getChapterFinanceMobile', chapterFinanceController.getChapterFinanceMobile);


//visitors
router.put("/updateVisitor/:visitorId", authMiddleware, visitorController.updateVisitor);
router.get("/getAllVisitors", authMiddleware, visitorController.getAllVisitors);
router.post("/toggleVisitorAttendance", visitorController.toggleVisitorAttendance);

//post
router.post('/createPost', authMiddleware, validator(postValidator.createPost), postController.createPost);
router.post('/updatePost', authMiddleware, validator(postValidator.updatePost), postController.updatePost);
router.post('/deletePost', authMiddleware, validator(postValidator.deletePost), postController.deletePost);
router.post('/togglePostStatus', authMiddleware, postController.togglePostStatus);
router.post('/getAllPosts', authMiddleware, postController.getAllPosts);


router.post("/createAttendance", authMiddleware, authMiddleware, validator(attendanceValidator.attendanceValidation), attendanceController.createAttendance);
router.get("/getAllAttendance", authMiddleware, attendanceController.getAllAttendance);
//router.get("/getAllAttendance/:userId", authMiddleware, attendanceController.getAllAttendanceUserId);

router.post('/participation', authMiddleware, attendanceController.updateEventParticipation);
router.put('/convert-to-user/:id', authController.convertMemberToUser);
// Get a user's participation status for an event
router.post('/userparticipation', authMiddleware, attendanceController.getUserEventParticipation);

// Get all participants for an event (admin view)
router.post('/getAllParticipant', attendanceController.getEventParticipants);

router.post("/getAllUpcomingEvents", authMiddleware, attendanceController.getAllUpcomingEvents);
router.post("/sendNotificationToUser", eventController.sendNotificationToUser);
router.post("/getAllRecentEvents", authMiddleware, attendanceController.getAllRecentEvents);
router.post("/createVisitor", authMiddleware, validator(visitorValidator.visitorValidation), attendanceController.createVisitor);
router.get("/getVisitors/:eventId", authMiddleware, attendanceController.getVisitorsByEventId);
router.post("/createBadge", badgeImageUploader.single('image'), badgeController.createBadge);
router.get("/getAllBadges", badgeController.getAllBadges);
router.put("/updateBadges/:id", badgeImageUploader.single('image'), badgeController.updateBadge);
router.delete("/deleteBadge/:id", badgeController.deleteBadge);
router.post("/assignBadge", badgeController.assignBadge);
router.post("/unassignBadge", badgeController.unassignBadge);
router.post("/getAllBadgesUsers", badgeController.getAllBadgesUsers);
router.get("/getUserBadges/:userId", badgeController.getUserBadges);
router.post('/getAllContactUs', ContactUsController.createContactUs);
router.post('/createContactUs', contactUsImageUploader.single('image'), ContactUsController.createContactUs);
router.put('/updateContactUs/:id', contactUsImageUploader.single('image'), ContactUsController.updateContactUs);
router.get('/getAllContactUs', ContactUsController.getAllContactUs);
router.post('/createFeePlan', feesController.createFeePlan);
router.get('/getAllFeePlans', feesController.getAllFeePlans);

// Complaints routes
router.get('/getAllComplaints', authMiddleware, complaintAdminController.getAllComplaints);
router.get('/getComplaintById/:id', authMiddleware, complaintAdminController.getComplaintById);
router.put('/updateComplaintStatus/:id', authMiddleware, complaintAdminController.updateComplaintStatus);
router.delete('/deleteComplaint/:id', authMiddleware, complaintAdminController.deleteComplaint);

// Suggestions routes
router.get('/getAllSuggestions', authMiddleware, suggestionAdminController.getAllSuggestions);
router.get('/getSuggestionById/:id', authMiddleware, suggestionAdminController.getSuggestionById);
router.put('/updateSuggestionStatus/:id', authMiddleware, suggestionAdminController.updateSuggestionStatus);
router.delete('/deleteSuggestion/:id', authMiddleware, suggestionAdminController.deleteSuggestion);








export default router;

