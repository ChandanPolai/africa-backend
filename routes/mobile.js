import express from 'express';
import createUploadMiddleware from '../middlewares/fileUploader.js'
import { userValdation } from '../controllers/mobile/validators/users.validator.js'
import validator from '../middlewares/validator.middleware.js';
import { authenticationController } from '../controllers/mobile/authentication.js';
import { refreshToken } from 'firebase-admin/app';
import authMiddleware from '../middlewares/auth.middleware.js';
import { userController } from '../controllers/mobile/user.controller.js';
import { qrListingController } from '../controllers/mobile/qr_listing.controller.js';
import { referralController } from '../controllers/mobile/referral.controller.js';
import referralValidator from '../controllers/mobile/validators/referral.validator.js';
import { tyfcbController } from '../controllers/mobile/tyfcb.controller.js';
import { oneToOneController } from '../controllers/mobile/oneToOne.controller.js';
import { oneToOneValidator } from '../controllers/mobile/validators/oneToOne.validator.js';
import { tenstimonialController } from '../controllers/mobile/testimonial.controller.js';
import { testimonialReqController } from '../controllers/mobile/testimonilaReq.controller.js';
import { locationController } from '../controllers/mobile/location.controller.js';
import { businessDataController } from '../controllers/mobile/businessData.controller.js';
import { notificationController } from '../controllers/mobile/notification.controller.js';
import { attendanceController } from '../controllers/mobile/attendance.controller.js';
import { attendanceValidator } from '../controllers/mobile/validators/attendance.validator.js';
import { visitorValidator } from '../controllers/mobile/validators/visitor.validator.js';
import { getCOuntController } from '../controllers/mobile/getCount.controller.js';
import { scannedCardController } from '../controllers/mobile/scannedCard.controller.js';
import { scanCardValidator } from '../controllers/mobile/validators/scannedCardsValidators.js';
import { tyfcbValidator } from '../controllers/mobile/validators/tyfcb.validator.js';
import { testimonialValidator } from '../controllers/mobile/validators/testimonial.valiator.js';
import { testimonialRequestvalidator } from '../controllers/mobile/validators/testimonialReq.validator.js';
import { postController } from '../controllers/mobile/post.controller.js';
import { favouriteController } from '../controllers/mobile/favourite.controller.js';
import { feedController } from '../controllers/mobile/feed.controller.js';
import { followersController } from '../controllers/mobile/followers.controller.js';
import { favouriteValidator } from '../controllers/mobile/validators/favourite.validator.js';
import { followersValidator } from '../controllers/mobile/validators/followers.validator.js';
import { feedValidator } from '../controllers/mobile/validators/feed.validator.js';
import { leaderboardController } from '../controllers/mobile/leaderboard.controller.js';
import { askController } from '../controllers/mobile/ask.controller.js';
import { businessGivenController } from '../controllers/mobile/businessGiven.controller.js';
import { complaintController } from '../controllers/mobile/complains.controller.js';
import { suggestionController } from '../controllers/mobile/suggestion.controller.js';
import { feedbackController } from '../controllers/mobile/feedback.controller.js';
import { blockController } from '../controllers/mobile/block.controller.js';
import { reportController } from '../controllers/mobile/report.controller.js';
import { shareHistoryController } from '../controllers/mobile/shareHistory.controller.js';
import { paymentController } from '../controllers/mobile/payment.controller.js';
import { testimonialController } from '../controllers/admin/testimonial.controller.js';
import { visitorAddListController } from '../controllers/mobile/VisitorAddList.js';
import { mobileImageCategoryController } from '../controllers/mobile/imageCategory.controller.js';


const router = express.Router();

//auth routes
const upload = createUploadMiddleware("User").single('profilePic');
const oneToOnePhotoUpload = createUploadMiddleware("OneToOne").single('oneToOnePhoto')
const uploadComplain = createUploadMiddleware("Complaint").single('image');
router.post('/auth/register', validator(userValdation.registerUserValidator), upload, authenticationController.registerUser);
// router.post('/auth/verify',authenticationController.verifyUser);
router.post('/auth/verify-mobile', authenticationController.isVerified);
router.post("/createReport", reportController.createReport);



router.post("/blockedUser", blockController.blockUser);
router.post('/unblockUser', blockController.unblockUser);
router.post("/getBlockedUsers", blockController.getBlockedUsers);
router.post("/auth/login", authenticationController.loginUser);
router.post("/isLT", authenticationController.isLT);
// router.post("/auth/resendOtp", authenticationController.resendOtp);
router.post("/auth/resend-mobile-otp", authenticationController.resendMobileOTP);
// router.post("/auth/refresh-token",authMiddleware, authenticationController.refreshToken);

router.post('/createAsk', askController.createAsk);
router.post('/my-asks', askController.getMyAsks);
router.post('/category-asks', askController.getAsksByCategory);
router.post('/add-lead', askController.addLeadToAsk);
router.post('/my-leads', askController.getMyLeads);
router.post('/update-status', askController.updateAskStatus);
router.post('/update-lead-status', askController.updateLeadStatus);
router.post('/delete', askController.deleteAsk);
router.post('/give', businessGivenController.giveBusiness);
router.post('/given', businessGivenController.getGivenBusiness);
router.post('/received', businessGivenController.getReceivedBusiness);
router.post('/update-status', businessGivenController.updateBusinessGivenStatus);
router.post('/delete', businessGivenController.deleteBusinessGiven);
router.post('/askByAskId', askController.askByAskId);
router.post('/getAllAsksForAdmin', askController.getAllAsksForAdmin);
router.post('/getMatchingPartners', askController.getMatchingPartners);
router.post('/getProfileCompletion', authenticationController.getProfileCompletion)

router.post('/give-business', askController.giveBusiness);
router.post('/leadByLeadId', askController.leadByLeadId);
router.get('/getFeesByUserId/:userId', userController.getFeesByUserId);
router.post("/addSocialMediaLinkUser", userController.addSocialMediaLinkUser);

// user Routes
// router.post("/users/refresh-token",authMiddleware, refreshToken);
router.get("/get-users", authMiddleware, userController.getAllUsers);
router.get("/get-users-comman-data", userController.getUsersCommanData); //not found in postman
router.post("/sendOther-Member-User-Ids", authMiddleware, userController.getAuthenticatedUserIds);
router.post("/get-other-member-data", authMiddleware, userController.getUserByMemberUserId);
router.get("/get-inside-users", authMiddleware, userController.getInsideChapterData);
router.get("/get-outside-users", authMiddleware, userController.getOutsideChapterData);
// router.get("/comman", authMiddleware, getUsersCommanData);
router.get("/get-users/:userId", authMiddleware, userController.getUserById);
router.get("/getAllUsersData", userController.getAllUsersData);
// router.post("/users/", authMiddleware, validator(userValdation.userSchema), upload, userController.createUser);
// router.delete("/users/delete/:id", authMiddleware, userController.deleteUser);
// router.delete("/users/deleted", authMiddleware, userController.deleteDisproveUser);
router.get("/get-users/email/:email", authMiddleware, userController.getUserByEmail);
router.put("/update-User/:userId", authMiddleware, upload, userController.updateUser);
router.put("/toggle-users-state/:userId", authMiddleware, userController.toggleUserStatus);
router.get("/users/:userId/business", authMiddleware, userController.getUserBusinessDetails);

const uploadLogo = createUploadMiddleware("Business-logo").single('logo');
router.post("/users/:userId/add-business", authMiddleware, validator(userValdation.businessSchema), uploadLogo, userController.addBusiness);
router.put("/users/:userId/update-business/:businessId", authMiddleware, validator(userValdation.businessSchema), uploadLogo, userController.updateBusiness);

router.get("/get-all-complaints/get-all", userController.getAllComplaints);
router.post("/add-complaints/:userId", validator(userValdation.complaintSchema), userController.addComplaint);
router.delete("/users/:userId/remove-complaints/:complaintId", authMiddleware, userController.removeComplaint);


router.post("/addComplanits", uploadComplain, complaintController.createComplaint);
router.get("/getComplaints", complaintController.getComplaints);
router.get("/getComplaintById/:complaintId", complaintController.getComplaintsByComplaintsId);
router.delete("/deleteComplaint/:complaintId", authMiddleware, complaintController.deleteComplaint);

router.get("/get-suggestions/get-all", authMiddleware, userController.getAllSuggestion);
router.post("/add-suggestions/:userId", authMiddleware, validator(userValdation.suggestionSchema), userController.addSuggestion);
router.delete("/users/:userId/remove-suggestions/:suggestionId", authMiddleware, userController.removeSuggestion);

router.post("/createSuggestion", suggestionController.createSuggestion);
router.get("/getSuggestions", suggestionController.getSuggestions);
router.get("/getSuggestionById/:suggestionId", suggestionController.getSuggestionsBySuggestionId);

router.post("/createFeedback", feedbackController.createFeedback);
router.get("/getFeedbacks", feedbackController.getFeedbacks);
router.post("/updateFeedbackStatus/:feedbackId", feedbackController.updateFeedbackStatus);
router.get("/getFeedbackById/:feedbackId", feedbackController.getFeedbacksByFeedbackId);

router.put('/update-bio-details/:userId', authMiddleware, userController.updateBioDetails);
router.put('/update-growth-sheet/:userId', authMiddleware, userController.updateGrowthSheet);
router.put('/update-top-profile/:userId', authMiddleware, userController.updateTopProfile);
router.put('/update-weekly-presentation/:userId', authMiddleware, userController.updateWeeklyPresentation);

router.post("/get-nearByUser", authMiddleware, validator(userValdation.getNearbyUsers), userController.getNearbyUsers);  //not tested

router.post("/createShareHistory", shareHistoryController.createShareHistory);
router.get("/getShareHistorys/:userId", shareHistoryController.getShareHistorys);

//qr listing
router.post("/add-scan-profile/:profileId", authMiddleware, qrListingController.addScannedprofile);
router.get("/get-all-scaned-profile/profiles", authMiddleware, qrListingController.getAllScannedProfiles);
router.get('/get-public-profile/:userId', authMiddleware, userController.getPublicProfile);


router.post("/create-referral", authMiddleware, validator(referralValidator), referralController.createReferral);
// router.get("/referrals/", authMiddleware, referralController.getAllReferrals);
router.get("/get-given-referral/:userId", authMiddleware, referralController.getReferralsGivenByUser);
router.get("/get-received-referral/:userId", referralController.getReferralsReceivedByUser);
router.post("/getreferralByReferralId", referralController.getreferralByReferralId);

// router.get("/referrals/received",authMiddleware, referralController.getAllReferralsRecieved);
// router.put("/referrals/updateReferral/:referralId", authMiddleware, referralController.updateReferral);
// router.delete("/referrals/deleteReferral/:referralId", authMiddleware, referralController.deleteReferral);


//tyfcb
router.post("/create-tyfcb", authMiddleware, validator(tyfcbValidator.tyfcbValidation), tyfcbController.createTyfcb);
// router.get("/tyfcbs/getAllTyfcb", authMiddleware, getAllTyfcb);
router.get("/get-tyfcbs-by-giverId/:userId", authMiddleware, tyfcbController.getTyfcbsByGiverId);
router.get("/get-tyfcbs-by-ReceiverId/:userId", authMiddleware, tyfcbController.getTyfcbsByReceiverId);
router.post("/getTyfcbById", tyfcbController.getTyfcbById);

// router.put("/tyfcbs/:tyfcbId/update", authMiddleware, updateTyfcb);
// router.delete("/tyfcbs/:tyfcbId/delete", authMiddleware, deleteTyfcb);

//one to one
// router.get("/oneToOnes/getAllOneToOne", authMiddleware, oneToOneController.getAllOneToOne);
router.post(
  "/create-oneToOne",

  oneToOnePhotoUpload, // Add this middleware
  validator(oneToOneValidator.oneToOneValidation),
  oneToOneController.createOneToOne
);
router.post("/getOneToOneById", oneToOneController.getOneToOneById);
router.get("/getInitiated-oneToOne/:userId", authMiddleware, oneToOneController.getInitiated);
router.get("/getNotInitiated-oneToOne/:userId", authMiddleware, oneToOneController.getNotInitiated);
// router.put("/oneToOnes/:oneToOneId/update", authMiddleware, oneToOneController.updateOneToOne);
// router.delete("/oneToOnes/:oneToOneId/delete", authMiddleware, oneToOneController.deleteOneToOne);

//testimonial
router.get("/get-testimonials", authMiddleware, tenstimonialController.getAllTestimonials);
router.post("/create-testimonials", validator(testimonialValidator.testimonialValidation), tenstimonialController.createTestimonial);
router.get('/get-testimonials-byReceiver/:receiverId', tenstimonialController.getTestimonialsByReceiverId);
router.patch("/toggle-testimonials/:testimonialId/selected", authMiddleware, tenstimonialController.toggleTestimonialSelected);
router.get("/testimonials/received/:receiverId/selected", tenstimonialController.getTestimonialsByReceiverIdWithSelected);
router.get("/testimonials/received/:receiverId/selected1", authMiddleware, tenstimonialController.getTestimonialsByReceiverIdWithSelected1)




// router.put("/testimonials/:testimonialId", authMiddleware, updateTestimonial);
// router.delete("/testimonials/:testimonialId", authMiddleware, deleteTestimonial);
router.get("/getTestimonialByUserId/:userId",  tenstimonialController.getTestimonialByUserId);

router.post("/create-testimonial-req", authMiddleware, validator(testimonialRequestvalidator.testimonialRequestSchema), testimonialReqController.createTestimonialRequest);
router.get("/get-testimonial-req", authMiddleware, testimonialReqController.getAllTestimonialRequests);
router.get("/get-testimonial-req/receiver/:receiverId", authMiddleware, testimonialReqController.getTestimonialRequestsByReceiverId);
router.put("/update-testimonial-request/:id", authMiddleware, testimonialReqController.updateTestimonialRequest);
// router.put("/:id", authMiddleware, updateTestimonialRequest);
// router.delete("/:id", authMiddleware,deleteTestimonialRequest);

//master route
router.get("/getAllLocationHierarchy", locationController.getAllLocationHierarchy);


router.get("/getAllBusinessHierarchy", businessDataController.getAllBusinessHierarchy);

//notification route
router.get('/getNotificationsById/:userId', notificationController.getNotificationsById);


//event 
router.post("/createAttendance", authMiddleware, authMiddleware, validator(attendanceValidator.attendanceValidation), attendanceController.createAttendance);
router.get("/getAllAttendance", attendanceController.getAllAttendance);
router.get("/getAllAttendance/:userId", attendanceController.getAllAttendanceUserId);
router.post("/getAllEvents", attendanceController.getAllEvents);
router.get("/getAllEventForAllUser", attendanceController.getAllEventForAllUser);
router.post("/getEventGallery", authMiddleware, attendanceController.getEventGallery);
router.post('/participation', authMiddleware, attendanceController.updateEventParticipation);

// Get a user's participation status for an event
router.post('/userparticipation', authMiddleware, attendanceController.getUserEventParticipation);

// Get all participants for an event (admin view)
router.post('/getAllParticipant', authMiddleware, attendanceController.getEventParticipants);
router.get('/getCurrentEventDay/:userId',  attendanceController.getCurrentEventDay);
router.post("/getAllUpcomingEvents", authMiddleware, attendanceController.getAllUpcomingEvents);
router.post("/getAllRecentEvents", authMiddleware, attendanceController.getAllRecentEvents);
router.post("/createVisitor", authMiddleware, validator(visitorValidator.visitorValidation), attendanceController.createVisitor);
router.get("/getVisitors/:eventId",  attendanceController.getVisitorsByEventId);

router.get ("/TestimonialById/:testimonialId",  tenstimonialController.TestimonialById);




// counts
router.get('/getUserDataCounts/:userId', getCOuntController.getUserDataCounts);
router.get('/getUserDataCountsDetails/:userId', getCOuntController.getUserDataCountsDetails);
router.post('/next-nearest-event', getCOuntController.getNextNearestEvent);
router.get('/getdata/counts', authMiddleware, getCOuntController.getDataCounts);

//scanned card
router.get("/scanned-cards", authMiddleware, scannedCardController.getScannedCards);
let scannedCard = createUploadMiddleware("scanned_cards").fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]);
router.post("/scanned-cards/save", authMiddleware, validator(scanCardValidator.businessCardValidation), scannedCard, scannedCardController.saveScannedCard);
router.delete("/scanned-cards/delete", authMiddleware, scannedCardController.deleteScannedCard);

//post apis
router.delete("/get-active-post", authMiddleware, postController.getActivePosts);

//favourite apis
router.post('/addToFavorites', authMiddleware, validator(favouriteValidator.addToFavorites), favouriteController.addToFavorites);
router.post('/removeFromFavorites', authMiddleware, validator(favouriteValidator.removeFromFavorites), favouriteController.removeFromFavorites);
router.post('/getFavorites', authMiddleware, validator(favouriteValidator.getFavorites), favouriteController.getFavorites);
router.post('/getUserFavorites', authMiddleware, validator(favouriteValidator.getUserFavourites), favouriteController.getUserFavorites);

//followers apis
router.post('/followUser', authMiddleware, validator(followersValidator.followUser), followersController.followUser);
router.post('/unfollowUser', authMiddleware, validator(followersValidator.unfollowUser), followersController.unfollowUser);
router.post('/getFollowers', authMiddleware, validator(followersValidator.getFollowers), followersController.getFollowers);
router.post('/getFollowing', authMiddleware, validator(followersValidator.getFollowing), followersController.getFollowing);
router.post('/getFeedsOfFollowedUsers', authMiddleware, validator(followersValidator.getFeedsOfFollowedUsers), followersController.getFeedsOfFollowedUsers);
router.post('/userfollowers', authMiddleware, validator(followersValidator.getUserFollowers), followersController.getUserFollowers);
router.post('/userfollowing', authMiddleware, validator(followersValidator.getUserFollowing), followersController.getUserFollowing);


// Leaderboard
router.get('/getAllLeaderboard', leaderboardController.getAllLeaderboards);
router.get('/getPointsHistory', leaderboardController.getPointsHistory);
router.post('/getPointsHistory1', leaderboardController.getPointsHistory1);




//feed apis8
const feedImageUploader = createUploadMiddleware('uploads/feedImages');
// const feedImageUploader = uploader('uploads/feedImages');
router.post('/createFeed', authMiddleware, validator(feedValidator.createFeed), feedImageUploader.array('images', 10), feedController.createFeed);
router.post('/deleteFeed', authMiddleware, validator(feedValidator.deleteFeed), feedController.deleteFeed);
router.post('/getFeeds', authMiddleware, validator(feedValidator.getFeeds), feedController.getFeeds);
router.post('/saveFeed', authMiddleware, validator(feedValidator.saveFeed), feedController.saveFeed);
router.post('/unsaveFeed', authMiddleware, feedController.unsaveFeed);
router.post('/getSavedFeeds', authMiddleware, feedController.getSavedFeeds);
router.post('/likeFeed', authMiddleware, validator(feedValidator.likeFeed), feedController.likeFeed);
router.post('/unlikeFeed', authMiddleware, validator(feedValidator.unlikeFeed), feedController.unlikeFeed);
router.post('/getOwnFeeds', authMiddleware, feedController.getOwnFeeds);
// router.post('/getCommentByfeedId', authMiddleware, validator(feedValidator.getComments), feedController.getComments)
// router.post('/getCommentByfeedId', authMiddleware, validator(feedValidator.), feedController.getComments);
router.post('/feedsOfSpecificUsers', authMiddleware, feedController.FeedsOfSpecificUsers);

//comment apis
router.post('/addComment', authMiddleware, validator(feedValidator.addComment), feedController.addComment);
router.post('/getComments', authMiddleware, validator(feedValidator.getComments), feedController.getComments);
router.post('/deleteComment', authMiddleware, validator(feedValidator.deleteComment), feedController.deleteComment);

// fee payment:
router.post('/verifyPayment/:userId',  paymentController.verifyPayment);
router.post('/getActiveFeePlans', authMiddleware, paymentController.getActiveFeePlans);
router.post('/getUserPaymentHistory/:userId', authMiddleware, paymentController.getUserPaymentHistory);
router.post('/getSubscriptionStatus', authMiddleware, paymentController.getSubscriptionStatus);
router.get('/getCurrentDuePayment/:userId', paymentController.getCurrentDuePayment);
router.post('/createMyVisitorList', visitorAddListController.createVisitorAddList);
router.get('/getVisitorList', visitorAddListController.getVisitorAddList);
router.delete('/deleteVisitorAddList/:id',  visitorAddListController.deleteVisitorAddList);
router.put('/updateVisitorAddList/:id', visitorAddListController.updateVisitorAddList);

// Image Categories APIs (Mobile)
router.post('/categoryPhotos', mobileImageCategoryController.getImageCategories);
router.post('/categoryPhotos/:id', mobileImageCategoryController.getImageCategoryById);

export default router;

