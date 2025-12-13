const models = require('./../../../models/zindex');
const response = require('./../../../core/response');
const validator = require('./../validators/nearBy.v');
const helper = require('./../../../core/helper');


exports.getNearbyUsers = async (req, res) => {
    try {
        const { error, value } = validator.getNearbyUsers.validate(req.body);
        if (error) {
            return response.success(error.message, null, res);
        }

        const { latitude, longitude, radius } = value; 

        if (!latitude || !longitude) {
            return response.success("Latitude and longitude are required!", null, res);
        }

       
        const users = await models.users.find({ 
            isDeleted: false, 
            isActive: true 
        })
        .select('name userImage mobileNo emailId businessesDetails')
        .populate({
            path: 'businessesDetails.userType',
            select: 'type name'
        });

        
        let nearbyUsers = [];
        
        users.forEach(user => {
            user.businessesDetails.forEach(business => {
                if (business.latitude && business.longitude) {
                    const distance = helper.calculateDistance(
                        latitude,
                        longitude,
                        business.latitude,
                        business.longitude
                    );
                    
                    if (distance <= radius) {
                        nearbyUsers.push({
                            userId: user._id,
                            name: user.name,
                            userImage: user.userImage,
                            mobileNo: user.mobileNo,
                            emailId: user.emailId,
                            business: {
                                _id: business._id,
                                businessName: business.businessName,
                                userType: business.userType || {},
                                address: business.address,
                                addressComponent: business.addressComponent || {},
                                latitude: business.latitude,
                                longitude: business.longitude,
                                distance: distance
                            }
                        });
                    }
                }
            });
        });

        // Sort by distance (nearest first)
        nearbyUsers.sort((a, b) => a.business.distance - b.business.distance);

        return response.success("Nearby users fetched successfully!", { 
            nearbyUsers,
            count: nearbyUsers.length
        }, res);
    } catch (err) {
        console.error("Error in getNearbyUsers:", {
            error: err.message,
            stack: err.stack,
            requestBody: req.body
        });
        return response.error(err.message || "Internal server error", res);
    }
};


