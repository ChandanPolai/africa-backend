import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { models } from './../../../models/zindex.js';
import { response } from './../../../utils/response.js';
import axios from 'axios';
import createUploadMiddleware from '../../../middlewares/fileUploader.js';
import { model } from 'mongoose';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parseNestedFormData = (body) => {
    const result = {};
    for (const key in body) {
        if (key.includes('[') && key.includes(']')) {
            // Handle nested keys like 'applicant[firstName]' or 'applicant[businessAddress][addressLine1]'
            const parts = key.split(/\[|\]/).filter(part => part !== '');
            let current = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    // Last part - assign the value
                    current[part] = body[key];
                } else {
                    // Intermediate part - create object if it doesn't exist
                    if (!current[part] || typeof current[part] !== 'object') {
                        current[part] = {};
                    }
                    current = current[part];
                }
            }
        } else {
            // Handle flat keys
            result[key] = body[key];
        }
    }
    return result;
};
const deleteOldFile = (filePath) => {
    if (filePath) {
        const fullPath = path.join(__dirname, '../../..', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};


// export const submitMemberApplication = async (req, res) => {
//     try {
//         // 1. Validate required files
//         if (!req.files?.aadhaarPhoto || req.files.aadhaarPhoto.length === 0) {
//             return response.error('Aadhaar photo is required', res);
//         }

//         // 2. Get uploaded files from Multer
//         const aadhaarFile = req.files.aadhaarPhoto[0];
//         const liveFile = req.files.livePhoto?.[0];

//         // 3. Create upload directory if it doesn't exist
//         const uploadDir = path.join(__dirname, '../../../uploads/MemberApplications');
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, { recursive: true });
//         }

//         // 4. Parse the nested form data
//         const parsedData = parseNestedFormData(req.body);

//         // 5. Build the form data structure with proper validation
//         const formData = {
//             chapter: parsedData.chapter,
//             region: parsedData.region,
//             invitedBy: parsedData.invitedBy,
//             visitDate: parsedData.visitDate,
//             howHeardAbout: parsedData.howHeardAbout,
//             applicant: {
//                 firstName: parsedData.applicant?.firstName,
//                 lastName: parsedData.applicant?.lastName,
//                 companyName: parsedData.applicant?.companyName,
//                 industry: parsedData.applicant?.industry,
//                 professionalClassification: parsedData.applicant?.professionalClassification,
//                 businessAddress: {
//                     addressLine1: parsedData.applicant?.businessAddress?.addressLine1,
//                     addressLine2: parsedData.applicant?.businessAddress?.addressLine2,
//                     state: parsedData.applicant?.businessAddress?.state,
//                     city: parsedData.applicant?.businessAddress?.city,
//                     postalCode: parsedData.applicant?.businessAddress?.postalCode
//                 },
//                 email: parsedData.applicant?.email,
//                 businessWebsite: parsedData.applicant?.businessWebsite,
//                 mobileNumber: parsedData.applicant?.mobileNumber,
//                 secondaryPhone: parsedData.applicant?.secondaryPhone,
//                 adhaarNumber: parsedData.applicant?.adhaarNumber,
//                 gstNumber: parsedData.applicant?.gstNumber,
//                 aadhaarPhoto: aadhaarFile.path.replace(/\\/g, "/"),
//                 livePhoto: ""
//             },
//             experience: {
//                 description: parsedData.experience?.description,
//                 lengthOfTime: parsedData.experience?.lengthOfTime,
//                 education: parsedData.experience?.education,
//                 licenseRevoked: parsedData.experience?.licenseRevoked || 'No',
//                 isPrimaryOccupation: parsedData.experience?.isPrimaryOccupation || 'Yes'
//             },
//             standards: {
//                 commitmentToMeetings: parsedData.standards?.commitmentToMeetings || 'Yes',
//                 commitmentToSubstitute: parsedData.standards?.commitmentToSubstitute || 'Yes',
//                 commitmentToReferrals: parsedData.standards?.commitmentToReferrals || 'Yes',
//                 referralAbility: parseInt(parsedData.standards?.referralAbility || 5)
//             },
//             gbsHistory: {
//                 previousMember: parsedData.gbsHistory?.previousMember || 'No',
//                 otherNetworkingOrgs: parsedData.gbsHistory?.otherNetworkingOrgs || 'No'
//             },
//             references: {
//                 reference1: {
//                     firstName: parsedData.references?.reference1?.firstName,
//                     lastName: parsedData.references?.reference1?.lastName,
//                     businessName: parsedData.references?.reference1?.businessName,
//                     phone: parsedData.references?.reference1?.phone,
//                     email: parsedData.references?.reference1?.email,
//                     relationship: parsedData.references?.reference1?.relationship
//                 },
//                 reference2: {
//                     firstName: parsedData.references?.reference2?.firstName,
//                     lastName: parsedData.references?.reference2?.lastName,
//                     businessName: parsedData.references?.reference2?.businessName,
//                     phone: parsedData.references?.reference2?.phone,
//                     email: parsedData.references?.reference2?.email,
//                     relationship: parsedData.references?.reference2?.relationship
//                 },
//                 informedReferences: parsedData.references?.informedReferences === 'true' ||
//                     parsedData.references?.informedReferences === true
//             },
//             termsAccepted: parsedData.termsAccepted === 'true' || parsedData.termsAccepted === true,
//             isActive: parsedData.isActive === 'true' || parsedData.isActive === true
//         };

//         // 6. Handle live photo (either from file upload or base64)
//         if (liveFile) {
//             formData.applicant.livePhoto = liveFile.path.replace(/\\/g, "/");
//         } else if (parsedData.livePhoto && parsedData.livePhoto.startsWith('data:image')) {
//             const base64Data = parsedData.livePhoto.replace(/^data:image\/\w+;base64,/, '');
//             const buffer = Buffer.from(base64Data, 'base64');
//             const livePhotoFileName = `live_${Date.now()}.png`;
//             const livePhotoFilePath = path.join(uploadDir, livePhotoFileName);

//             await fs.promises.writeFile(livePhotoFilePath, buffer);
//             formData.applicant.livePhoto = `/uploads/MemberApplications/${livePhotoFileName}`;
//         } else {
//             return response.error(400, res);
//         }

//         // 7. Validate required fields before saving
//         const requiredFields = [
//             'applicant.firstName',
//             'applicant.lastName',
//             'applicant.companyName',
//             'applicant.industry',
//             'applicant.professionalClassification',
//             'applicant.email',
//             'applicant.mobileNumber',
//             'applicant.adhaarNumber',
//             'applicant.businessAddress.addressLine1',
//             'applicant.businessAddress.city',
//             'applicant.businessAddress.state',
//             'applicant.businessAddress.postalCode'
//         ];

//         const missingFields = [];
//         for (const field of requiredFields) {
//             const parts = field.split('.');
//             let value = formData;
//             for (const part of parts) {
//                 value = value[part];
//                 if (value === undefined) break;
//             }
//             if (value === undefined || value === '') {
//                 missingFields.push(field);
//             }
//         }

//         if (missingFields.length > 0) {
//             return response.error("error", res)
//         }

//         // 8. Save application to database
//         const application = new models.memberApplication(formData);
//         await application.save();

//         // 9. Return success response
//         return response.success('Application submitted successfully', true, res
//         );

//     } catch (error) {
//         console.error('Submission error:', error);

//         // Handle validation errors specifically
//         if (error.name === 'ValidationError') {
//             const errors = {};
//             for (const field in error.errors) {
//                 errors[field] = error.errors[field].message;
//             }
//             return response.error('Validation error', res);
//         }

//         // Generic error response
//         return response.error("server error", res);
//     }
// };

export const submitMemberApplication = async (req, res) => {
    try {
        // 1. Parse the nested form data
        const parsedData = parseNestedFormData(req.body);

        // Helper function to parse date strings
        const parseDate = (dateValue) => {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue;
            if (typeof dateValue === 'string') {
                const parsed = new Date(dateValue);
                return isNaN(parsed.getTime()) ? null : parsed;
            }
            return null;
        };

        // 2. Build the form data structure with proper validation
        const formData = {
            chapter: parsedData.chapter || "",
            region: parsedData.region || "",
            invitedBy: parsedData.invitedBy || "",
            visitDate: parsedData.visitDate || "",
            howHeardAbout: parsedData.howHeardAbout || "",
            applicant: {
                firstName: parsedData.applicant?.firstName || "",
                lastName: parsedData.applicant?.lastName || "",
                companyName: parsedData.applicant?.companyName || "",
                industry: parsedData.applicant?.industry || "",
                professionalClassification: parsedData.applicant?.professionalClassification || "",
                businessAddress: {
                    addressLine1: parsedData.applicant?.businessAddress?.addressLine1 || "",
                    addressLine2: parsedData.applicant?.businessAddress?.addressLine2 || "",
                    state: parsedData.applicant?.businessAddress?.state || "",
                    city: parsedData.applicant?.businessAddress?.city || "",
                    postalCode: parsedData.applicant?.businessAddress?.postalCode || ""
                },
                email: parsedData.applicant?.email || "",
                businessWebsite: parsedData.applicant?.businessWebsite || "",
                mobileNumber: parsedData.applicant?.mobileNumber || "",
                // NEW FIELDS ADDED HERE
                dateOfBirth: parseDate(parsedData.applicant?.dateOfBirth),
                spouseName: parsedData.applicant?.spouseName || "",
                anniversaryDate: parseDate(parsedData.applicant?.anniversaryDate),
                bloodGroup: parsedData.applicant?.bloodGroup || "",
                // END OF NEW FIELDS
            },
            experience: {
                description: parsedData.experience?.description || "",
                lengthOfTime: parsedData.experience?.lengthOfTime || "",
                education: parsedData.experience?.education || "",
                licenseRevoked: parsedData.experience?.licenseRevoked || 'No',
                isPrimaryOccupation: parsedData.experience?.isPrimaryOccupation || 'Yes'
            },
            standards: {
                commitmentToMeetings: parsedData.standards?.commitmentToMeetings || 'Yes',
                commitmentToSubstitute: parsedData.standards?.commitmentToSubstitute || 'Yes',
                commitmentToReferrals: parsedData.standards?.commitmentToReferrals || 'Yes',
                referralAbility: parseInt(parsedData.standards?.referralAbility || 5)
            },
            gbsHistory: {
                previousMember: parsedData.gbsHistory?.previousMember || 'No',
                otherNetworkingOrgs: parsedData.gbsHistory?.otherNetworkingOrgs || 'No'
            },
            termsAccepted: parsedData.termsAccepted === 'true' || parsedData.termsAccepted === true,
            isActive: parsedData.isActive === 'true' || parsedData.isActive === true
        };

        // 3. Validate required fields before saving
        const requiredFields = [
            'applicant.firstName',
            'applicant.lastName',
            'applicant.companyName',
            'applicant.industry',
            'applicant.professionalClassification',
            'applicant.email',
            'applicant.mobileNumber',
            'applicant.dateOfBirth',
            'applicant.businessAddress.addressLine1',
            'applicant.businessAddress.city',
            'applicant.businessAddress.state',
            'applicant.businessAddress.postalCode'
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            const parts = field.split('.');
            let value = formData;
            for (const part of parts) {
                if (value === undefined || value === null) break;
                value = value[part];
            }
            // Check if value is missing, empty string, null, or invalid date
            if (value === undefined || value === '' || value === null || 
                (value instanceof Date && isNaN(value.getTime()))) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Missing required fields",
                missingFields,
                success: false
            });
        }

        // 4. Save application to database
        const application = new models.memberApplication(formData);
        await application.save();

        // 5. Return success response
        return res.status(200).json({
            message: 'Application submitted successfully',
            status: 200,
            success: true
        });

    } catch (error) {
        console.error('Submission error:', error);

        // Handle validation errors specifically
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                message: "Validation error",
                errors,
                success: false
            });
        }
        // Generic error response
        return res.status(500).json({
            message: "Server error",
            error: error.message,
            success: false
        });
    }
};


export const editMemberApplication = async (req, res) => {
    try {
        // 1. Validate application ID
        const { applicationId } = req.body;
        if (!applicationId) {
            return response('Application ID is required', res);
        }

        // 2. Create upload directory if needed
        const uploadDir = path.join(__dirname, '../../../uploads/MemberApplications');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 3. Find existing application
        const existingApplication = await models.memberApplication.findById(applicationId);
        if (!existingApplication) {
            return response('Application not found', res);
        }

        // 4. Parse the nested form data
        const parsedData = parseNestedFormData(req.body);

        // 5. Prepare updated data with fallback to existing values
        let updatedData = {
            chapter: parsedData.chapter || existingApplication.chapter,
            region: parsedData.region || existingApplication.region,
            invitedBy: parsedData.invitedBy || existingApplication.invitedBy,
            visitDate: parsedData.visitDate || existingApplication.visitDate,
            howHeardAbout: parsedData.howHeardAbout || existingApplication.howHeardAbout,
            applicant: {
                firstName: parsedData.applicant?.firstName || existingApplication.applicant.firstName,
                lastName: parsedData.applicant?.lastName || existingApplication.applicant.lastName,
                companyName: parsedData.applicant?.companyName || existingApplication.applicant.companyName,
                industry: parsedData.applicant?.industry || existingApplication.applicant.industry,
                professionalClassification: parsedData.applicant?.professionalClassification || existingApplication.applicant.professionalClassification,
                businessAddress: {
                    addressLine1: parsedData.applicant?.businessAddress?.addressLine1 || existingApplication.applicant.businessAddress.addressLine1,
                    addressLine2: parsedData.applicant?.businessAddress?.addressLine2 || existingApplication.applicant.businessAddress.addressLine2,
                    state: parsedData.applicant?.businessAddress?.state || existingApplication.applicant.businessAddress.state,
                    city: parsedData.applicant?.businessAddress?.city || existingApplication.applicant.businessAddress.city,
                    postalCode: parsedData.applicant?.businessAddress?.postalCode || existingApplication.applicant.businessAddress.postalCode
                },
                email: parsedData.applicant?.email || existingApplication.applicant.email,
                businessWebsite: parsedData.applicant?.businessWebsite || existingApplication.applicant.businessWebsite,
                mobileNumber: parsedData.applicant?.mobileNumber || existingApplication.applicant.mobileNumber,
                secondaryPhone: parsedData.applicant?.secondaryPhone || existingApplication.applicant.secondaryPhone,
                adhaarNumber: parsedData.applicant?.adhaarNumber || existingApplication.applicant.adhaarNumber,
                gstNumber: parsedData.applicant?.gstNumber || existingApplication.applicant.gstNumber,
                aadhaarPhoto: existingApplication.applicant.aadhaarPhoto,
                livePhoto: existingApplication.applicant.livePhoto
            },
            experience: {
                description: parsedData.experience?.description || existingApplication.experience.description,
                lengthOfTime: parsedData.experience?.lengthOfTime || existingApplication.experience.lengthOfTime,
                education: parsedData.experience?.education || existingApplication.experience.education,
                licenseRevoked: parsedData.experience?.licenseRevoked || existingApplication.experience.licenseRevoked,
                isPrimaryOccupation: parsedData.experience?.isPrimaryOccupation || existingApplication.experience.isPrimaryOccupation
            },
            standards: {
                commitmentToMeetings: parsedData.standards?.commitmentToMeetings || existingApplication.standards.commitmentToMeetings,
                commitmentToSubstitute: parsedData.standards?.commitmentToSubstitute || existingApplication.standards.commitmentToSubstitute,
                commitmentToReferrals: parsedData.standards?.commitmentToReferrals || existingApplication.standards.commitmentToReferrals,
                referralAbility: parseInt(parsedData.standards?.referralAbility || existingApplication.standards.referralAbility)
            },
            gbsHistory: {
                previousMember: parsedData.gbsHistory?.previousMember || existingApplication.gbsHistory.previousMember,
                otherNetworkingOrgs: parsedData.gbsHistory?.otherNetworkingOrgs || existingApplication.gbsHistory.otherNetworkingOrgs
            },
            references: {
                reference1: {
                    firstName: parsedData.references?.reference1?.firstName || existingApplication.references.reference1.firstName,
                    lastName: parsedData.references?.reference1?.lastName || existingApplication.references.reference1.lastName,
                    businessName: parsedData.references?.reference1?.businessName || existingApplication.references.reference1.businessName,
                    phone: parsedData.references?.reference1?.phone || existingApplication.references.reference1.phone,
                    email: parsedData.references?.reference1?.email || existingApplication.references.reference1.email,
                    relationship: parsedData.references?.reference1?.relationship || existingApplication.references.reference1.relationship
                },
                reference2: {
                    firstName: parsedData.references?.reference2?.firstName || existingApplication.references.reference2.firstName,
                    lastName: parsedData.references?.reference2?.lastName || existingApplication.references.reference2.lastName,
                    businessName: parsedData.references?.reference2?.businessName || existingApplication.references.reference2.businessName,
                    phone: parsedData.references?.reference2?.phone || existingApplication.references.reference2.phone,
                    email: parsedData.references?.reference2?.email || existingApplication.references.reference2.email,
                    relationship: parsedData.references?.reference2?.relationship || existingApplication.references.reference2.relationship
                },
                informedReferences: parsedData.references?.informedReferences === 'true' ||
                    parsedData.references?.informedReferences === true ||
                    existingApplication.references.informedReferences
            },
            termsAccepted: parsedData.termsAccepted === 'true' || parsedData.termsAccepted === true || existingApplication.termsAccepted,
            isActive: parsedData.isActive === 'true' || parsedData.isActive === true || existingApplication.isActive
        };

        // 6. Handle Aadhaar photo update (Multer file)
        if (req.files?.aadhaarPhoto) {
            deleteOldFile(existingApplication.applicant.aadhaarPhoto);
            const aadhaarFile = req.files.aadhaarPhoto[0];
            updatedData.applicant.aadhaarPhoto = aadhaarFile.path.replace(/\\/g, "/");
        }

        // 7. Handle live photo update (Multer file or base64)
        if (req.files?.livePhoto) {
            deleteOldFile(existingApplication.applicant.livePhoto);
            const livePhotoFile = req.files.livePhoto[0];
            updatedData.applicant.livePhoto = livePhotoFile.path.replace(/\\/g, "/");
        } else if (parsedData.livePhoto && parsedData.livePhoto.startsWith('data:image')) {
            deleteOldFile(existingApplication.applicant.livePhoto);
            const base64Data = parsedData.livePhoto.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const livePhotoFileName = `live_${Date.now()}.png`;
            const livePhotoFilePath = path.join(uploadDir, livePhotoFileName);
            await fs.promises.writeFile(livePhotoFilePath, buffer);
            updatedData.applicant.livePhoto = `/uploads/MemberApplications/${livePhotoFileName}`;
        }

        // 8. Validate required fields
        const requiredFields = [
            'applicant.firstName',
            'applicant.lastName',
            'applicant.companyName',
            'applicant.industry',
            'applicant.professionalClassification',
            'applicant.email',
            'applicant.mobileNumber',
            'applicant.adhaarNumber',
            'applicant.businessAddress.addressLine1',
            'applicant.businessAddress.city',
            'applicant.businessAddress.state',
            'applicant.businessAddress.postalCode'
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            const parts = field.split('.');
            let value = updatedData;
            for (const part of parts) {
                value = value[part];
                if (value === undefined) break;
            }
            if (value === undefined || value === '') {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return response.error('Missing required fields', res);
        }

        // 9. Update the application
        const updatedApplication = await models.memberApplication.findByIdAndUpdate(
            applicationId,
            { $set: updatedData },
            { new: true, runValidators: true }
        );

        return response.success('Application updated successfully', true, res
        );

    } catch (error) {
        console.error('Update error:', error);

        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return response.error('Validation error', res);
        }

        return response.error('Error updating application', 400)

    }
};


export const submitRenewalApplication = async (req, res) => {
    try {
        // Convert checkbox values to proper booleans
        const formData = {
            ...req.body,
            termsAccepted: req.body.termsAccepted === 'true'
        };

        const { error, value } = validator.submitRenewalApplication.validate(formData);
        if (error) {
            return response.success(error.details[0].message, 0, res);
        }

        const renewalApplication = new models.renewalApplication(value);
        await renewalApplication.save();

        return response.success("Renewal application submitted successfully!", { application: renewalApplication }, res);
    } catch (err) {
        return response.error(err, res);
    }
};

// export const submitEventRegistration = async (req, res) => {
//     try {
//         // 1. Validate required payment proof file
//         if (!req.files?.paymentProof || req.files.paymentProof.length === 0) {
//             return response.error('Payment proof is required', res);
//         }

//         // 2. Get uploaded files from Multer
//         const paymentProofFile = req.files.paymentProof[0];

//         // 3. Create upload directory if it doesn't exist
//         const uploadDir = path.join(__dirname, '../../../uploads/EventPayments');
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, { recursive: true });
//         }

//         // 4. Parse the nested form data
//         const parsedData = parseNestedFormData(req.body);

//         // 5. Validate required fields
//         const requiredFields = [
//             'userType',
//             'firstName',
//             'lastName',
//             'invitedBy',
//             'mobileNumber'
//         ];

//         const missingFields = requiredFields.filter(field => !parsedData[field]);
//         if (missingFields.length > 0) {
//             return response.error(`Missing required fields: ${missingFields.join(', ')}`, res);
//         }

//         // 6. Validate registration type
//         if (!['Visitor', 'Member'].includes(parsedData.userType)) {
//             return response.error("Invalid registration type. Must be 'Visitor' or 'Member'.", res);
//         }

//         // 7. Validate chapter for members
//         if (parsedData.userType === 'Member' && !parsedData.chapter) {
//             return response.error("Chapter selection is required for members.", res);
//         }

//         // 8. Validate mobile number format
//         if (!/^[0-9]{10}$/.test(parsedData.mobileNumber)) {
//             return response.error("Mobile number must be a valid 10-digit number.", res);
//         }

//         // 9. Build the form data structure
//         const formData = {
//             userType: parsedData.userType || 'Visitor',
//             chapter: parsedData.userType === 'Member' ? parsedData.chapter : '',
//             invitedBy: parsedData.invitedBy,
//             howHeardAbout: "GBS Launch Event",
//             paymentDetails: {
//                 amount: 1000, // Default event fee
//                 paymentProof: paymentProofFile.path.replace(/\\/g, "/"),
//                 paymentDate: new Date()
//             },
//             applicant: {
//                 firstName: parsedData.firstName,
//                 lastName: parsedData.lastName,
//                 companyName: "",
//                 industry: "",
//                 professionalClassification: "",
//                 businessAddress: {
//                     addressLine1: "",
//                     addressLine2: "",
//                     state: "",
//                     city: "",
//                     postalCode: ""
//                 },
//                 email: parsedData.email || "",
//                 businessWebsite: "",
//                 mobileNumber: parsedData.mobileNumber,
//                 secondaryPhone: "",
//                 adhaarNumber: "",
//                 gstNumber: "",
//                 aadhaarPhoto: "",
//                 livePhoto: ""
//             },
//             experience: {},
//             standards: {},
//             gbsHistory: {},
//             references: {
//                 informedReferences: false
//             },
//             termsAccepted: true, // Assuming event registration implies acceptance
//             isActive: false,
//             eventRegistration: true // Flag to identify event registrations
//         };

//         // 10. Save application to database
//         const application = new models.memberApplication(formData);
//         await application.save();

//         // 11. Return success response
//         return response.success('Event registration submitted successfully', {
//             registrationId: application._id,
//             paymentReceived: true
//         }, res);

//     } catch (error) {
//         console.error('Event registration error:', error);

//         // Handle validation errors specifically
//         if (error.name === 'ValidationError') {
//             const errors = {};
//             for (const field in error.errors) {
//                 errors[field] = error.errors[field].message;
//             }
//             return response.error('Validation error', res);
//         }

//         // Generic error response
//         return response.error("Server error during registration", res);
//     }
// };


export const submitEventRegistration = async (req, res) => {
    try {
        if (!req.files?.paymentProof || req.files.paymentProof.length === 0) {
            return response.error('Payment proof is required', 400, res);
        }

        const paymentProofFile = req.files.paymentProof[0];

        const uploadDir = path.join(__dirname, '../../../Uploads/EventPayments');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const parsedData = parseNestedFormData(req.body);

        const requiredFields = [
            'userType',
            'firstName',
            'lastName',
            'invitedBy',
            'mobileNumber'
        ];

        const missingFields = requiredFields.filter(field => !parsedData[field]);
        if (missingFields.length > 0) {
            return response.error(`Missing required fields: ${missingFields.join(', ')}`, 400, res);
        }

        if (!['Visitor', 'Member'].includes(parsedData.userType)) {
            return response.error("Invalid registration type. Must be 'Visitor' or 'Member'.", 400, res);
        }

        if (parsedData.userType === 'Member' && !parsedData.chapter) {
            return response.error("Chapter selection is required for members.", 400, res);
        }

        if (!/^[0-9]{10}$/.test(parsedData.mobileNumber)) {
            return response.error("Mobile number must be a valid 10-digit number.", 400, res);
        }

        const formData = {
            userType: parsedData.userType || 'Visitor',
            chapter: parsedData.userType === 'Member' ? parsedData.chapter : '',
            invitedBy: parsedData.invitedBy,
            howHeardAbout: "GBS Launch Event",
            paymentDetails: {
                amount: 1000, // Default event fee
                paymentProof: paymentProofFile.path.replace(/\\/g, "/"),
                paymentDate: new Date()
            },
            digitalCard: "",
            applicant: {
                firstName: parsedData.firstName,
                lastName: parsedData.lastName,
                companyName: "",
                industry: "",
                professionalClassification: "",
                businessAddress: {
                    addressLine1: "",
                    addressLine2: "",
                    state: "",
                    city: "",
                    postalCode: ""
                },
                email: parsedData.email || "",
                businessWebsite: "",
                mobileNumber: parsedData.mobileNumber,
                secondaryPhone: "",
                adhaarNumber: "",
                gstNumber: "",
                aadhaarPhoto: "",
                livePhoto: ""
            },
            experience: {},
            standards: {},
            gbsHistory: {},
            references: {
                informedReferences: false
            },
            termsAccepted: true,
            isActive: false,
            eventRegistration: true
        };

        const application = new models.memberApplication(formData);
        await application.save();

        const digitalCardPayload = {
            name: `${parsedData.firstName} ${parsedData.lastName}`.trim(),
            email: parsedData.email || "",
            mobile: parsedData.mobileNumber,
            businessKeyword: parsedData.businessKeyword || "GBS",
            originId: "685a80c61ecf5bcb96968fb7",
            countryCode: "91"
        };

        console.log("Digital Card Payload:", digitalCardPayload);

        let digitalCardResponse = null;
        let digitalCardError = null;

        try {
            const apiResponse = await axios.post(
                'https://gbscard.itfuturz.in/web/create-account/mobile',
                digitalCardPayload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            digitalCardResponse = apiResponse.data;

            if (digitalCardResponse && digitalCardResponse.data?.path) {
                application.digitalCard = digitalCardResponse.data.path;
                application.digitalCardStatus = 'created';
                await application.save();
            }
        } catch (error) {
            console.error('Digital card creation failed:', error);
            digitalCardError = {
                message: error.message,
                response: error.response?.data || null,
                status: error.response?.status || 500
            };

            application.digitalCardStatus = 'failed';
            await application.save();
        }

        const successResponse = {
            registrationId: application._id,
            paymentReceived: true,
            registrationStatus: 'success',
            digitalCard: {
                attempted: true,
                status: digitalCardError ? 'failed' : 'success',
                response: digitalCardError ? digitalCardError : digitalCardResponse,
                timestamp: new Date()
            }
        };

        return response.success('Event registration submitted successfully', successResponse, res);

    } catch (error) {
        console.error('Event registration error:', error);

        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return response.error('Validation error', 400, res);
        }

        return response.error("Server error during registration", 500, res);
    }
};


export const convertToDigitalCard = async (req, res) => {
    try {
        const applications = await models.User.find({
            "digitCardLink": { $in: ["", null] },
        });

        for (let application of applications) {
            const digitalCardPayload = {
                name: application.name || "",
                email: application.email || "",
                mobile: application.mobile_number || "",
                businessKeyword: "GBS", // Default value as per original logic
                originId: "685a80c61ecf5bcb96968fb7",
                countryCode: "91"
            };

            console.log("Digital Card Payload:", digitalCardPayload);

            try {
                const apiResponse = await axios.post(
                    'https://gbscard.itfuturz.in/web/create-account/mobile',
                    digitalCardPayload,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const digitalCardResponse = apiResponse.data;

                if (digitalCardResponse?.data?.path) {
                    await models.User.findByIdAndUpdate(
                        application._id, 
                        { digitCardLink: digitalCardResponse.data.path },
                        { new: true }
                    );
                }
            } catch (error) {
                console.error('Digital card creation failed for user:', application._id, error);
            }
        }

        return response.success('Digital card conversion completed', applications, res);

    } catch (error) {
        console.error('Digital card conversion error:', error);
        return response.error('Server error during digital card conversion', 500, res);
    }
};


// mobile_number
// "7016348030"



// digitalCardLink
// "https://gbscard.itfuturz.in/6867da49798cc66074c7c3ed"



// applicant: {
    
//     mobileNumber
// }
      
//     digitalCard
// "https://gbscard.itfuturz.in/685e7b7c195ba81659c88514"

export const matchdigitalcard = async (req, res) => {

    try {
        const applications = await models.User.find({});
        console.log("Applications to match:", applications.length);
        await Promise.all(applications.map(async (application) => {
            const matchedApplication = await models.memberApplication.findOne({ 
                'applicant.mobileNumber': application.mobile_number,
                digitalCard: { $exists: true, $ne: "" }
            });
            console.log("Matched Application:", matchedApplication);
            if (matchedApplication) {
                await models.User.findByIdAndUpdate( 
                    application._id,
                    { digitCardLink: matchedApplication.digitalCard },
                    { new: true }
                );
            }
        }));
        return response.success('Digital card links matched successfully', true, res);
    } catch (error) {
        console.error('Error matching digital card links:', error);
        return response.error('Server error during digital card matching', 500, res);
    }
};






export const submitBasicMemberApplication = async (req, res) => {
    try {
        const { firstName, lastName, invitedBy, mobileNumber } = req.body;
        console.log("Received data:", req.body);

        // Basic validation
        if (!firstName || !lastName || !invitedBy || !mobileNumber) {
            return response.error("All fields (firstName, lastName, invitedBy, mobileNumber) are required.", res);
        }

        // Validate mobile number format
        if (!/^[0-9]{10}$/.test(mobileNumber)) {
            return response.error("Mobile number must be a valid 10-digit number.", res);
        }

        const formData = {
            invitedBy,
            howHeardAbout: "",
            applicant: {
                firstName,
                lastName,
                companyName: "",
                industry: "",
                professionalClassification: "",
                businessAddress: {
                    addressLine1: "",
                    addressLine2: "",
                    state: "",
                    city: "",
                    postalCode: ""
                },
                email: "",
                businessWebsite: "",
                mobileNumber,
                secondaryPhone: "",
                adhaarNumber: "",
                gstNumber: "",
                aadhaarPhoto: "",
                livePhoto: ""
            },
            experience: {},
            standards: {},
            gbsHistory: {},
            references: {
                informedReferences: false
            },
            termsAccepted: false,
            isActive: false
        };

        const application = new models.memberApplication(formData);
        await application.save();

        return response.success("Basic application submitted successfully.", true, res);
    } catch (error) {
        console.error("Basic submission error:", error);
        return response.error("Server error", res);
    }
};


export const getActiveApplications = async (req, res) => {
    try {
        // Access specific properties from req.body
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;
        const search = req.body.search || ''; // Get search parameter

        // Build query - removed adhaarNumber filter since it's no longer in the form
        const query = {};
        
        if (search) {
            query.$or = [
                { 'applicant.firstName': { $regex: search, $options: 'i' } }, // Case-insensitive search
                { 'applicant.lastName': { $regex: search, $options: 'i' } },
                { 'applicant.companyName': { $regex: search, $options: 'i' } },
                { 'applicant.email': { $regex: search, $options: 'i' } },
                { 'applicant.mobileNumber': { $regex: search, $options: 'i' } }
            ];
        }

        const options = {
            page,
            limit,
            sort: { createdAt: -1 }, // Sort by createdAt in descending order
        };

        const result = await models.memberApplication.paginate(query, options);

        return response.success("Member applications retrieved successfully!", result, res);
    } catch (err) {
        console.error('Error in getActiveApplications:', err);
        return response.error(err, res);
    }
};

// 
export const getEventRegistrations = async (req, res) => {
    try {
        // Access specific properties from req.body
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;
        const search = req.body.search || '';
        const userType = req.body.userType; // Optional filter for Visitor/Member
        const chapter = req.body.chapter; // Optional filter for specific chapter

        // Build base query for event registrations
        const query = {
            eventRegistration: true, // Only get event registrations
            'paymentDetails.paymentProof': { $exists: true, $ne: "" },
            createdAt: { $gte: new Date('2025-06-14T00:00:00.000Z') } // Filter from June 14, 2025
        };

        // Add userType filter if specified
        if (userType && ['Visitor', 'Member'].includes(userType)) {
            query.userType = userType;

            // If userType is Member and chapter is specified, add chapter filter
            if (userType === 'Member' && chapter) {
                query.chapter = chapter;
            }

            // If userType is Visitor, ensure chapter is empty
            if (userType === 'Visitor') {
                query.chapter = '';
            }
        } else if (chapter) {
            // If only chapter is specified without userType
            query.chapter = chapter;
        }

        // Add search conditions if search parameter exists
        if (search) {
            const searchConditions = {
                $or: [
                    { 'applicant.firstName': { $regex: search, $options: 'i' } },
                    { 'applicant.lastName': { $regex: search, $options: 'i' } },
                    { 'applicant.mobileNumber': { $regex: search, $options: 'i' } },
                    { 'invitedBy': { $regex: search, $options: 'i' } }
                ]
            };

            // If we already have conditions in query, use $and
            if (Object.keys(query).length > 0) {
                query.$and = [
                    ...(query.$and || []),
                    searchConditions
                ];
            } else {
                Object.assign(query, searchConditions);
            }
        }

        const options = {
            page,
            limit,
            sort: { createdAt: -1 }, // Newest first
            select: 'userType chapter invitedBy createdAt paymentDetails applicant digitalCard' // Only return necessary fields
        };

        const result = await models.memberApplication.paginate(query, options);

        // Format the response data
        const formattedData = {
            ...result,
            docs: result.docs.map(doc => ({
                id: doc._id,
                userType: doc.userType,
                chapter: doc.chapter,
                name: `${doc.applicant.firstName} ${doc.applicant.lastName}`,
                mobileNumber: doc.applicant.mobileNumber,
                digitalCard: doc.digitalCard,

                invitedBy: doc.invitedBy,
                paymentStatus: doc.paymentDetails ? 'Paid' : 'Pending',
                paymentProof: doc.paymentDetails?.paymentProof,
                registrationDate: doc.createdAt
            }))
        };

        return response.success("Event registrations retrieved successfully!", formattedData, res);
    } catch (err) {
        console.error('Error in getEventRegistrations:', err);
        return response.error(err.message || "Error fetching event registrations", res);
    }
};
export const getActiveApplications1 = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 10;
        const search = req.body.search || '';

        // Common date filter
        const dateFilter = {
            createdAt: {
                $gte: new Date('2025-06-06T00:00:00.000Z'),
                $lt: new Date('2025-06-08T00:00:00.000Z')
            }
        };

        let query = {};

        if (search) {
            query.$and = [
                dateFilter,
                {
                    $or: [
                        { 'applicant.firstName': { $regex: search, $options: 'i' } },
                        { 'applicant.lastName': { $regex: search, $options: 'i' } },
                        { 'applicant.companyName': { $regex: search, $options: 'i' } }
                    ]
                }
            ];
        } else {
            query = dateFilter;
        }

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
        };

        const result = await models.memberApplication.paginate(query, options);

        return response.success("Member applications retrieved successfully!", result, res);
    } catch (err) {
        console.error('Error in getActiveApplications1:', err);
        return response.error(err, res);
    }
};
