import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import moment from 'moment-timezone';
import crypto from 'crypto';

// Set timezone to IST
moment.tz.setDefault('Asia/Kolkata');


const verifyPayment = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    let {
        razorpay_payment_id,
       
        feePlanId,
        amount,
        status,
    } = req.body;

    // Validate inputs
    if (!razorpay_payment_id ) {
        return res.status(200).json({
            data:false,
            success: false,
            message: 'Missing Razorpay payment details'
        });
    }

    try {
      
        const feePlan = await models.FeeMaster.findById(feePlanId);
        if (!feePlan || !feePlan.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Fee plan not available or inactive'
            });
        }

        // Validate amount matches plan
        // if (feePlan.amount !== amount) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Payment amount doesn't match fee plan"
        //     });
        // }

        // Calculate dates using Moment.js with Asia/Kolkata timezone
        const paymentDate = moment().tz('Asia/Kolkata').toDate();
        const startDate = moment().tz('Asia/Kolkata').toDate();
        const endDate = moment().tz('Asia/Kolkata')
                          .add(feePlan.durationInMonths, 'months')
                          .toDate();

        // Get user's current fee status
        const user = await models.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if this is a renewal or initial payment
        const currentEndDate = user.fees.end_date ? moment(user.fees.end_date).tz('Asia/Kolkata') : null;
        const isRenewal = currentEndDate && currentEndDate.isAfter(moment().tz('Asia/Kolkata'));

        // Create payment record
        const payment = await models.paymentHistory.create({
            userId,
            feeMasterId: feePlanId,
            amount,
            paymentDate,
            razorpayPaymentId: razorpay_payment_id,
            // razorpayOrderId: razorpay_order_id,
            // razorpaySignature: razorpay_signature,
            status: status ,
            startDate,
            endDate,
            isRenewed: isRenewal,
            remarks: `Payment for ${feePlan.name} (${feePlan.type}) plan`
        });

        // Update user's fee information
        const updateData = {
            'fees.currentPlan': feePlanId,
            'fees.end_date': endDate,
            'fees.is_renewed': true,
            $inc: {
                'fees.paid_fee': amount,
                'fees.total_fee': amount
            },
            $push: {
                'fees.fee_history': {
                    paymentId: payment._id,
                    amount: amount,
                    payment_date: paymentDate,
                    remarks: `Payment for ${feePlan.name} plan via Razorpay (${payment._id})`
                }
            }
        };

        // For initial payment, set induction date
        if (!isRenewal && !user.fees.induction_date) {
            updateData['fees.induction_date'] = paymentDate;
        }

        await models.User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Payment verified and processed successfully!",
            data: {
                paymentId: payment._id,
                planDetails: {
                    name: feePlan.name,
                    type: feePlan.type,
                    amount: feePlan.amount,
                    duration: `${feePlan.durationInMonths} months (${feePlan.durationInMonths/12} years)`
                },
                dates: {
                    paymentDate: moment(paymentDate).tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm A'),
                    startDate: moment(startDate).tz('Asia/Kolkata').format('DD-MM-YYYY'),
                    endDate: moment(endDate).tz('Asia/Kolkata').format('DD-MM-YYYY')
                },
                isRenewal,
                razorpayDetails: {
                    paymentId: razorpay_payment_id,
                    
                }
            }
        });

    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
});










const getActiveFeePlans = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { amount: 1 },
        lean: true
    };

    const result = await models.FeeMaster.paginate(
        { isActive: true },
        options
    );

    return response.success("Active fee plans fetched successfully!", result, res);
});

// Get user's payment history
const getUserPaymentHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { paymentDate: -1 },
        populate: {
            path: 'feeMasterId',
            select: 'name type amount durationInMonths'
        }
    };

    const result = await models.paymentHistory.paginate(
        { userId },
        options
    );

    return response.success("Payment history fetched successfully!", result, res);
});

// Get user's current subscription status
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await models.User.findById(userId)
        .select('fees')
        .populate('fees.currentPlan', 'name type amount durationInMonths');

    if (!user) {
        return response.error("User not found", res, 404);
    }

    const now = moment();
    const isActive = user.fees.end_date && moment(user.fees.end_date).isAfter(now);

    return response.success("Subscription status fetched successfully!", {
        currentPlan: user.fees.currentPlan,
        endDate: user.fees.end_date,
        isActive,
        paidFee: user.fees.paid_fee,
        pendingFee: user.fees.pending_fee
    }, res);
});



const getCurrentDuePayment = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the latest payment record for the user
    const latestPayment = await models.paymentHistory.findOne({ userId })
      .sort({ endDate: -1 })
      .populate('feeMasterId');

    const currentDate = moment().tz('Asia/Kolkata');

    // If no payment history exists
    if (!latestPayment) {
      return res.status(200).json({
        success: true,
        message: "Status fetched successfully",
        data: {
          status: "due",
          dueSince: null,
          isOverdue: false,
          endDate: null,
          daysRemaining: 0,
          feeItem: null
        }
      });
    }

    const endDate = moment(latestPayment.endDate).tz('Asia/Kolkata');
    const feeMaster = latestPayment.feeMasterId;

    // If current date is before or equal to end date
    if (currentDate.isSameOrBefore(endDate)) {
      return res.status(200).json({
        success: true,
        message: "Status fetched successfully",
        data: {
          status: "active",
          dueSince: null,
          isOverdue: false,
          endDate: endDate.format('YYYY-MM-DD'),
          daysRemaining: endDate.diff(currentDate, 'days'),
          feeItem: feeMaster ? {
            id: feeMaster._id.toString(),
            name: feeMaster.name,
            description: feeMaster.description,
            amount: feeMaster.amount,
            type: feeMaster.type,
            durationInMonths: feeMaster.durationInMonths,
            isActive: feeMaster.isActive,
            createdAt: feeMaster.createdAt,
            updatedAt: feeMaster.updatedAt,
            v: feeMaster.__v || 0
          } : null
        }
      });
    }

    // If current date is after end date (subscription expired)
    if (currentDate.isAfter(endDate)) {
      // Check if there's any renewal payment after this one
      const renewalPayment = await models.paymentHistory.findOne({
        userId,
        startDate: { $gt: latestPayment.startDate }
      }).populate('feeMasterId');

      // If no renewal found, mark as due
      if (!renewalPayment) {
        const daysSinceDue = currentDate.diff(endDate, 'days');

        return res.status(200).json({
          success: true,
          message: "Status fetched successfully",
          data: {
            status: "due",
            dueSince: endDate.toDate(),
            isOverdue: true,
            endDate: endDate.format('YYYY-MM-DD'),
            daysRemaining: 0,
            feeItem: feeMaster ? {
              id: feeMaster._id.toString(),
              name: feeMaster.name,
              description: feeMaster.description,
              amount: feeMaster.amount,
              type: feeMaster.type,
              durationInMonths: feeMaster.durationInMonths,
              isActive: feeMaster.isActive,
              createdAt: feeMaster.createdAt,
              updatedAt: feeMaster.updatedAt,
              v: feeMaster.__v || 0
            } : null
          }
        });
      }

      // If renewal exists, check its status
      const renewalEndDate = moment(renewalPayment.endDate).tz('Asia/Kolkata');
      const renewalFeeMaster = renewalPayment.feeMasterId;

      if (currentDate.isSameOrBefore(renewalEndDate)) {
        return res.status(200).json({
          success: true,
          message: "Status fetched successfully",
          data: {
            status: "active",
            dueSince: null,
            isOverdue: false,
            endDate: renewalEndDate.format('YYYY-MM-DD'),
            daysRemaining: renewalEndDate.diff(currentDate, 'days'),
            feeItem: renewalFeeMaster ? {
              id: renewalFeeMaster._id.toString(),
              name: renewalFeeMaster.name,
              description: renewalFeeMaster.description,
              amount: renewalFeeMaster.amount,
              type: renewalFeeMaster.type,
              durationInMonths: renewalFeeMaster.durationInMonths,
              isActive: renewalFeeMaster.isActive,
              createdAt: renewalFeeMaster.createdAt,
              updatedAt: renewalFeeMaster.updatedAt,
              v: renewalFeeMaster.__v || 0
            } : null
          }
        });
      } else {
        const daysSinceDue = currentDate.diff(renewalEndDate, 'days');

        return res.status(200).json({
          success: true,
          message: "Status fetched successfully",
          data: {
            status: "due",
            dueSince: renewalEndDate.toDate(),
            isOverdue: true,
            endDate: renewalEndDate.format('YYYY-MM-DD'),
            daysRemaining: 0,
            feeItem: renewalFeeMaster ? {
              id: renewalFeeMaster._id.toString(),
              name: renewalFeeMaster.name,
              description: renewalFeeMaster.description,
              amount: renewalFeeMaster.amount,
              type: renewalFeeMaster.type,
              durationInMonths: renewalFeeMaster.durationInMonths,
              isActive: renewalFeeMaster.isActive,
              createdAt: renewalFeeMaster.createdAt,
              updatedAt: renewalFeeMaster.updatedAt,
              v: renewalFeeMaster.__v || 0
            } : null
          }
        });
      }
    }

  } catch (error) {
    console.error("Error checking due status:", error);
    return res.status(500).json({
      success: false,
      message: 'Error checking due status',
      error: error.message
    });
  }
});

export const paymentController = {
    verifyPayment,
    getActiveFeePlans,
    getUserPaymentHistory,
    getSubscriptionStatus,
    getCurrentDuePayment

};