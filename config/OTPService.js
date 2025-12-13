import axios from 'axios';
import { models } from './../models/zindex.js';
export class otpService {
    constructor() {
        // SMS Provider Configuration
        this.smsApiKey = process.env.SMS_API_KEY;
        this.smsSender = process.env.SMS_SENDER;
        this.smsRoute = process.env.SMS_ROUTE;
        this.smsBaseUrl = process.env.SMS_BASE_URL;

        this.appHash = process.env.APP_HASH || '';
        this.appName = process.env.APP_NAME || 'GBS';


        // OTP Configuration
        this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        this.bypassOTP = process.env.BYPASS_OTP || '2345';

        // Load bypass numbers
        this.bypassNumbers = [];
        if (process.env.BYPASS_NUMBERS) {
            try {
                this.bypassNumbers = process.env.BYPASS_NUMBERS.split(',')
                    .map(num => num.trim())
                    .filter(num => num.length > 0);
                console.log('Loaded bypass numbers:', this.bypassNumbers);
            } catch (error) {
                console.error('Error parsing BYPASS_NUMBERS:', error);
            }
        }
    }

    _isNumberInBypassList(mobileNo) {
        const normalizedNumber = mobileNo.toString().trim();
        return this.bypassNumbers.includes(normalizedNumber);
    }

    async _sendSMS(mobileNo, otpValue) {
        let hashSuffix = this.appHash;
        if (!hashSuffix) {

            hashSuffix = 'ABC123XYZW9'; // Example fallback
        }
        const message = `Your OTP for GBS is ${otpValue}. This password would be valid for 5 minutes only.\nFLASHB`;

      //  const message = `Your OTP for GBS is ${otpValue}. Valid for 5 minutes.\nFLASHB`;
        console.log("Sending SMS with message:", message);
        const encodedMessage = encodeURIComponent(message);
        console.log("my message", encodedMessage);

        const url = `${this.smsBaseUrl}?apikey=${this.smsApiKey}&route=${this.smsRoute}&sender=${this.smsSender}&mobileno=${mobileNo}&text=${encodedMessage}`;

        console.log("SMS API URL:", url);

        try {
            const response = await axios.get(url);
            console.log("SMS API Response:", response.data);

            if (response.data.status === 'success') {
                return {
                    success: true,
                    message: 'SMS sent successfully',
                    data: response.data
                };
            } else {
                throw new Error(response.data.message || 'Failed to send SMS');
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }

    async sendOTP(mobileNo, name) {
        try {
            const normalizedMobileNo = mobileNo.toString().trim();
            console.log(`Processing sendOTP for number: ${normalizedMobileNo}`);




            // Check if number is in bypass list
            if (this._isNumberInBypassList(normalizedMobileNo)) {
                console.log(`Bypassing OTP for ${normalizedMobileNo}`);

                // Delete any existing unused OTPs for this number
                await models.OTP.deleteMany({
                    mobileNo: normalizedMobileNo,
                    name: name,
                    isUsed: false,
                    expiresAt: { $gt: new Date() }
                });

                const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60000);
                const sessionId = `BYPASS-${Date.now()}`;

                await models.OTP.create({
                    mobileNo: normalizedMobileNo,
                    name,
                    sessionId,
                    expiresAt
                });

                return {
                    success: true,
                    message: 'OTP bypass enabled for this number',
                    data: {
                        sessionId,
                        expiresAt
                    }
                };
            }

            // Delete existing unused OTPs
            await models.OTP.deleteMany({
                mobileNo: normalizedMobileNo,
                isUsed: false,
                name: name,
                expiresAt: { $gt: new Date() }
            });


            const otpValue = Math.floor(1000 + Math.random() * 9000).toString();
            const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60000);
            const sessionId = `SMS-${Date.now()}`;

            let otpRecord = await models.OTP.create({
                mobileNo: normalizedMobileNo,
                sessionId,
                otp: otpValue,
                name: name || "",
                isSent: false,
                expiresAt,
                createdAt: new Date()
            });


            const smsResult = await this._sendSMS(normalizedMobileNo, otpValue);

            if (smsResult.success) {


                otpRecord.isSent = true;
                await otpRecord.save();


                return {
                    success: true,
                    message: 'OTP sent successfully',
                    data: {
                        sessionId,
                        expiresAt
                    }
                };
            } else {
                throw new Error(smsResult.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    }

    async verifyOTP(mobileNo, otpCode) {
        try {
            const normalizedMobileNo = mobileNo.toString().trim();
            const normalizedOTPCode = otpCode.toString().trim();

            console.log(`Processing verifyOTP for number: ${normalizedMobileNo}, code: ${normalizedOTPCode}`);

            const otpRecord = await models.OTP.findOne({
                mobileNo: normalizedMobileNo,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 });

            if (!otpRecord) {
                console.log(`No valid OTP record found for ${normalizedMobileNo} or OTP has expired`);
                return {
                    success: false,
                    message: 'OTP expired or not found'
                };
            }

            const currentTime = new Date();
            const isExpired = otpRecord.expiresAt <= currentTime;

            console.log(`Found OTP record: ${JSON.stringify({
                sessionId: otpRecord.sessionId,
                expiresAt: otpRecord.expiresAt,
                currentTime: currentTime,
                isExpired: isExpired
            })}`);

            if (isExpired) {
                console.log(`OTP has expired. Expiry: ${otpRecord.expiresAt}, Current: ${currentTime}`);
                return {
                    success: false,
                    message: 'OTP has expired'
                };
            }

            // Bypass OTP verification
            if (otpRecord.sessionId.startsWith('BYPASS-')) {
                console.log(`Processing bypass verification for ${normalizedMobileNo}`);

                if (normalizedOTPCode === this.bypassOTP) {
                    otpRecord.isUsed = true;
                    await otpRecord.save();
                    return {
                        success: true,
                        message: 'OTP bypass verification successful'
                    };
                } else {
                    return {
                        success: false,
                        message: 'Invalid bypass OTP'
                    };
                }
            }

            // Normal OTP verification
            if (otpRecord.otp === normalizedOTPCode) {
                otpRecord.isUsed = true;
                await otpRecord.save();
                return {
                    success: true,
                    message: 'OTP verified successfully'
                };
            } else {
                return {
                    success: false,
                    message: 'Invalid OTP'
                };
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return {
                success: false,
                message: 'Invalid or mismatch OTP'
            };
        }
    }

    async resendOTP(mobileNo) {
        try {
            const normalizedMobileNo = mobileNo.toString().trim();
            console.log(`Processing resendOTP for number: ${normalizedMobileNo}`);

            const deleteResult = await models.OTP.deleteMany({
                mobileNo: normalizedMobileNo,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });
            console.log(`Deleted ${deleteResult.deletedCount} existing OTP records before resend`);

            return this.sendOTP(normalizedMobileNo);
        } catch (error) {
            console.error('Error resending OTP:', error);
            throw new Error('Failed to resend OTP');
        }
    }
}
