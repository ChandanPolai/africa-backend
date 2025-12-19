import { models } from "../../models/zindex.js";
import asyncHandler from 'express-async-handler';
import { response } from "../../utils/response.js";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import XLSX from 'xlsx';
import path from 'path'
import multer from 'multer';
import archiver from 'archiver'


// Helper function to format date
const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'N/A';
};




// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Add this new controller function
const importUsersFromExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.error("No file uploaded",  400, res);
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return response.error("No data found in the Excel file", null, res, 400);
    }

    const usersToImport = jsonData.map(row => ({
      name: row.name || '',
      chapter_name: row.chapter_name || '',
      city: row.city || '',
      state: row.state || '',
      country: row.country || '',
      mobile_number: row.mobile_number || '',
      email: row.email || '',
      //meeting_role: row.meeting_role || ''
    }));

    // Insert users into database
    const result = await models.User.insertMany(usersToImport, { ordered: false });

    // Delete the uploaded file after processing
    fs.unlinkSync(req.file.path);

    return response.success(
      `Successfully imported ${result.length} users`,
      { importedCount: result.length },
      res
    );
  } catch (error) {
    // Delete the uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error.writeErrors) {
      const duplicateCount = error.writeErrors.length;
      const importedCount = error.insertedCount;
      return response.success(
        `Imported ${importedCount} users successfully. ${duplicateCount} duplicate entries skipped.`,
        { importedCount, duplicateCount },
        res
      );
    }

    return response.error("Error processing Excel file", error.message, res, 500);
  }
});


export const importTestimonialsFromExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.error("No file uploaded",  400, res);
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Get raw rows as 2D array
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip if not enough rows
    if (rawRows.length < 2) {
      fs.unlinkSync(req.file.path);
      return response.error("No data found in the sheet", null, res, 400);
    }

    const inserted = [];
    const skipped = [];

    // Build a user map for fast lookup
    const allUsers = await models.User.find().select("name");
    const userMap = {};
    allUsers.forEach(user => {
      userMap[user.name.trim().toLowerCase()] = user;
    });

    // Loop from 2nd row (index 1), assuming first row is headers
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const givenByName = row[1]?.trim();
      const givenToName = row[2]?.trim();
      const message = row[3]?.trim();
      const date = row[4] ? new Date(row[4]) : new Date();

      if (!givenByName || !givenToName || !message) {
        skipped.push({ reason: "Missing fields", row });
        continue;
      }

      const giver = userMap[givenByName.toLowerCase()];
      const receiver = userMap[givenToName.toLowerCase()];

      if (!giver || !receiver) {
        skipped.push({
          reason: `${!giver ? "Giver not found" : ""} ${!receiver ? "Receiver not found" : ""}`,
          givenBy: givenByName,
          givenTo: givenToName
        });
        continue;
      }

      const newTestimonial = new models.TestimonialModel({
        giverId: giver._id,
        receiverId: receiver._id,
        message,
        date
      });

      await newTestimonial.save();
      inserted.push({ givenBy: givenByName, givenTo: givenToName });
    }

    fs.unlinkSync(req.file.path); // delete uploaded file

    return response.success("Testimonial import completed", {
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    }, res);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return response.error(error.message,   500, res);
  }
});

export const importOneToOneFromExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return response.error("No file uploaded",  400, res);
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawRows.length < 2) {
      fs.unlinkSync(req.file.path);
      return response.error("No data found in the sheet",  400, res);
    }

    const inserted = [];
    const skipped = [];

    // Load all users and build a lookup map
    const allUsers = await models.User.find().select("name");
    const userMap = {};
    allUsers.forEach(user => {
      userMap[user.name.trim().toLowerCase()] = user;
    });

    // Loop through rows starting from second row (skip header)
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const fromName = typeof row[1] === 'string' ? row[1].trim() : (row[1]?.toString().trim() || '');
      const withName = typeof row[2] === 'string' ? row[2].trim() : (row[2]?.toString().trim() || '');
      const initiatedByName = typeof row[3] === 'string' ? row[3].trim() : (row[3]?.toString().trim() || '');
      const meetPlace = typeof row[4] === 'string' ? row[4].trim() : (row[4]?.toString().trim() || '');
      const dateRaw = row[5]; // don't trim this — it's probably a Date or Excel serial
      const topics = typeof row[6] === 'string' ? row[6].trim() : (row[6]?.toString().trim() || '');

      const date = dateRaw ? new Date(dateRaw) : new Date();

      // Lookups
      let fromUser = userMap[fromName.toLowerCase()];
      let withUser = userMap[withName.toLowerCase()];
      let initiatedByUser = userMap[initiatedByName.toLowerCase()];

      // Optional fallback: fuzzy match if not found
      if (!fromUser) {
        fromUser = await models.User.findOne({ name: new RegExp(`^${fromName}$`, 'i') });
      }
      if (!withUser) {
        withUser = await models.User.findOne({ name: new RegExp(`^${withName}$`, 'i') });
      }
      if (!initiatedByUser) {
        initiatedByUser = await models.User.findOne({ name: new RegExp(`^${initiatedByName}$`, 'i') });
      }

      if (!fromUser || !withUser || !initiatedByUser) {
        skipped.push({
          reason: `${!fromUser ? "From not found. " : ""}${!withUser ? "With not found. " : ""}${!initiatedByUser ? "Initiator not found." : ""}`,
          row,
        });
        continue;
      }

      const newOneToOne = new models.OneToOne({
        memberId1: fromUser._id,
        memberId2: withUser._id,
        initiatedBy: initiatedByUser._id,
        meet_place: meetPlace,
        date,
        topics,
      });

      await newOneToOne.save();
      inserted.push({ from: fromName, with: withName });
    }

    fs.unlinkSync(req.file.path); // Cleanup temp file

    return response.success("One-to-One meeting import completed", {
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    }, res);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return response.error( error.message,  500, res);
  }
});
// const getAllUsers = asyncHandler(async (req, res) => {
//     const { search, page = 1, limit = 10, verified, meeting_role } = req.query;

//     let searchRegex = search ? new RegExp(search, "i") : null;

//     let query = {};

//     if (searchRegex) {
//       query.$or = [
//         { name: searchRegex },
//         { email: searchRegex },
//         { mobile_number: searchRegex },
//         { address: searchRegex },
//         { chapter_name: searchRegex },
//       ];
//     }

//     if (verified !== undefined) {
//       query.verified = verified === "true";
//     }

//     if (meeting_role) {
//       query.meeting_role = meeting_role;
//     }

//     const options = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       sort: { createdAt: -1 },
//       select:
//         "name chapter_name mobile_number email date_of_birth marriage_anniversary profilePic emergency_contact keywords address introduction_details meeting_role business complains suggestions latitude longitude acc_active paid_fees pending_fees due_date_fees points verified verificationCode fcm isActive bioDetails growthSheet topProfile weeklyPresentation",
//     };

//     const users = await models.User.paginate(query, options);

//     return response.success("Users retrieved successfully!", users, res);
// });



const isActiveStatus = asyncHandler(async (req, res) => {
  console.log("isActiveStatus called" , req.body);
  const { id } = req.body;
  const user = await models.User.findById(id);
  if (!user) {
    return response.success("User not found", null, res);
  }
  user.isActive = !user.isActive; // Toggle isActive status
  await user.save();
  return response.success("User status updated successfully", user.isActive, res);
});
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10, verified, meeting_role, chapter } = req.query;

  let query = {};

  // First filter by chapter if specified
  if (chapter) {
    query.chapter_name = chapter;
  }

  // Then apply search within the chapter (or all users if no chapter specified)
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { mobile_number: searchRegex },
        { address: searchRegex },
        { business: searchRegex },
        { introduction_details: searchRegex }
      ]
    });
  }

  if (verified !== undefined) {
    query.verified = verified === "true";
  }

  if (meeting_role) {
    query.meeting_role = meeting_role;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: "name chapter_name mobile_number email date_of_birth marriage_anniversary profilePic emergency_contact keywords address introduction_details meeting_role business complains suggestions latitude longitude acc_active paid_fees digitalCardLink pending_fees due_date_fees points verified verificationCode fcm isActive bioDetails growthSheet topProfile weeklyPresentation"
  };

  const users = await models.User.paginate(query, options);

  return response.success("Users retrieved successfully!", users, res);
});
  export const importReferralsFromExcel = asyncHandler(async (req, res) => {
    if (!req.file) return response.error("No file uploaded", 400, res);
  
    try {
      const workbook = XLSX.readFile(req.file.path);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
      if (rawRows.length < 2) {
        fs.unlinkSync(req.file.path);
        return response.error("No data found in the sheet", 400, res);
      }
  
      const updated = [];
      const skipped = [];
  
      const allUsers = await models.User.find().select("name");
      const userMap = {};
      allUsers.forEach(u => {
        userMap[u.name.trim().toLowerCase()] = u;
      });
  
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
  
        const fromName = typeof row[1] === 'string' ? row[1].trim() : (row[1]?.toString().trim() || '');
        const toName = typeof row[2] === 'string' ? row[2].trim() : (row[2]?.toString().trim() || '');
        const referralValue = typeof row[4] === 'string' ? row[4].trim() : (row[4]?.toString().trim() || '');
  
        const giver = userMap[fromName.toLowerCase()] || await models.User.findOne({ name: new RegExp(`^${fromName}$`, 'i') });
        const receiver = userMap[toName.toLowerCase()] || await models.User.findOne({ name: new RegExp(`^${toName}$`, 'i') });
  
        if (!giver || !receiver) {
          skipped.push({ reason: "User(s) not found", row });
          continue;
        }
  
        const referralDoc = await models.Referral.findOne({
          giver_id: giver._id,
          receiver_id: receiver._id,
        });
  
        if (!referralDoc) {
          skipped.push({ reason: "Referral not found", row });
          continue;
        }
  
        referralDoc.referral = referralValue;
        await referralDoc.save();
        updated.push({ from: fromName, to: toName });
      }
  
      fs.unlinkSync(req.file.path);
      return response.success("Referral fields updated successfully", {
        updatedCount: updated.length,
        skippedCount: skipped.length,
        updated,
        skipped,
      }, res);
  
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return response.error(error.message, 500, res);
    }
  });
  
  // 

  
// export const importTyfcbFromExcel = asyncHandler(async (req, res) => {
//   if (!req.file) return response.error("No file uploaded", 400, res);

//   try {
//     // 1. Read and parse Excel file
//     const workbook = XLSX.readFile(req.file.path);
//     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rows = XLSX.utils.sheet_to_json(worksheet); // Uses first row as header

//     if (rows.length === 0) {
//       fs.unlinkSync(req.file.path);
//       return response.error("No data found in the Excel file", 400, res);
//     }

//     // 2. Preload all users to map by name (case insensitive)
//     const allUsers = await models.User.find().select("name");
//     const userMap = {};
//     allUsers.forEach(u => {
//       userMap[u.name.trim().toLowerCase()] = u;
//     });

//     const inserted = [];
//     const skipped = [];

//     // 3. Iterate over rows
//     for (const rawRow of rows) {
//       // Normalize keys: trim and lowercase
//       const row = {};
//       Object.entries(rawRow).forEach(([key, value]) => {
//         row[key.trim().toLowerCase()] = typeof value === 'string' ? value.trim() : value;
//       });
    
//       const fromName = row["name"] || "";
//       const toName = row["reciever"] || "";
//       const amountValue = Number(row["tfycb given"]) || 0;
    
//       if (!fromName || !toName) {
//         skipped.push({ reason: "Missing giver or receiver", row: rawRow });
//         continue;
//       }
    
//       const giver = userMap[fromName.toLowerCase()] || await models.User.findOne({ name: new RegExp(`^${fromName}$`, 'i') });
//       const receiver = userMap[toName.toLowerCase()] || await models.User.findOne({ name: new RegExp(`^${toName}$`, 'i') });
    
//       if (!giver || !receiver) {
//         skipped.push({ reason: "User(s) not found", row: rawRow });
//         continue;
//       }
    
//       await models.Tyfcbs.create({
//         giverId: giver._id,
//         receiverId: receiver._id,
//         amount: amountValue,
//         business_type: "New",
//         referral_type: "Inside",
//         comments: ""
//       });
    
//       inserted.push({ from: fromName, to: toName, amount: amountValue });
//     }
//     // 4. Cleanup and respond
//     fs.unlinkSync(req.file.path);

//     return response.success("TYFCB import completed", {
//       insertedCount: inserted.length,
//       skippedCount: skipped.length,
//       inserted,
//       skipped
//     }, res);

//   } catch (err) {
//     if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//     return response.error(err.message || "Something went wrong", 500, res);
//   }
// });


export const importTyfcbFromExcel = asyncHandler(async (req, res) => {
  if (!req.file) return response.error("No file uploaded", 400, res);

  try {
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(worksheet); // Reads using headers in first row

    const inserted = [];
    const skipped = [];

    const allUsers = await models.User.find().select("name");
    const userMap = {};
    allUsers.forEach(u => {
      userMap[u.name.trim().toLowerCase()] = u;
    });

    for (const rawRow of rawRows) {
      // Normalize keys
      const row = {};
      Object.entries(rawRow).forEach(([key, value]) => {
        row[key.trim().toLowerCase()] = typeof value === 'string' ? value.trim() : value;
      });

      const receiverName = row["recived name"] || "";
      const giverName = row["name"] || "";
      const amountValue = Number(row["revenue recived"]) || 0;

      if (!receiverName || !giverName || !amountValue) {
        skipped.push({ reason: "Missing required fields", row: rawRow });
        continue;
      }

      const receiver = userMap[receiverName.toLowerCase()] || await models.User.findOne({ name: new RegExp(`^${receiverName}$`, "i") });
      const giver = userMap[giverName.toLowerCase()] || await models.User.findOne({ name: new RegExp(`^${giverName}$`, "i") });

      if (!receiver || !giver) {
        skipped.push({ reason: "User(s) not found", row: rawRow });
        continue;
      }

      await models.Tyfcbs.create({
        giverId: giver._id,
        receiverId: receiver._id,
        amount: amountValue,
        business_type: "New",
        referral_type: "Inside",
        comments: "Imported via Received TYFCB"
      });

      inserted.push({ from: giverName, to: receiverName, amount: amountValue });
    }

    fs.unlinkSync(req.file.path);
    return response.success("TYFCB received import completed", {
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped
    }, res);

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return response.error(error.message, 500, res);
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedUser = await models.User.findByIdAndDelete(id);

  if (!deletedUser) {
    return response.success("User not found", null, res);
  }
  return response.success("User deleted successfully", true, res);
});

// const generateUserPDF = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Find the user by ID
//     const user = await models.User.findById(id)
//       .select('name chapter_name mobile_number email date_of_birth marriage_anniversary profilePic emergency_contact address introduction_details meeting_role keywords points business bioDetails growthSheet topProfile weeklyPresentation')
//       .lean();

//     if (!user) {
//       return response.serverError("User not found", res);
//     }

//     // Create a new PDF document
//     const doc = new PDFDocument({
//       size: 'A4',
//       margin: 40,
//       layout: 'portrait'
//     });

//     // Set response headers before piping
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${(user.name || 'user').replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`);

//     // Pipe the PDF to the response
//     doc.pipe(res);

//     // Handle errors
//     doc.on('error', (error) => {
//       console.error('PDF generation error:', error);
//       if (!res.headersSent) {
//         res.status(500).json({ error: 'PDF generation failed' });
//       }
//     });

//     res.on('error', (error) => {
//       console.error('Response error:', error);
//     });

//     // Constants for styling
//     const colors = {
//       primary: '#2563eb',
//       secondary: '#64748b',
//       accent: '#f1f5f9',
//       border: '#e2e8f0',
//       text: '#1e293b',
//       textLight: '#64748b',
//       white: '#ffffff'
//     };

//     const margins = {
//       left: 40,
//       right: 40,
//       top: 40,
//       bottom: 40
//     };

//     const spacing = {
//       sectionTitle: 20,
//       tableTitle: 12,
//       tableBottom: 15,
//       cardBottom: 12,
//       smallGap: 8,
//       mediumGap: 15,
//       largeGap: 25
//     };

//     const pageWidth = doc.page.width - margins.left - margins.right;
//     let isFirstPage = true;

//     // Helper function to safely format values
//     const safeValue = (value) => {
//       if (value === null || value === undefined || value === '') return 'N/A';
//       if (typeof value === 'number') return value.toString();
//       if (typeof value === 'boolean') return value ? 'Yes' : 'No';
//       if (value instanceof Date) return value.toLocaleDateString();
//       return String(value).trim();
//     };

//     // Helper function to format dates
//     const formatDate = (dateString) => {
//       if (!dateString) return 'N/A';
//       try {
//         const date = new Date(dateString);
//         return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
//       } catch {
//         return 'N/A';
//       }
//     };

//     // Improved page break checker
//     const checkPageBreak = (currentY, requiredHeight) => {
//       const remainingSpace = doc.page.height - margins.bottom - currentY;
      
//       if (remainingSpace < requiredHeight) {
//         // Add footer to current page before adding new page (except first page)
//         if (!isFirstPage) {
//           const footerY = doc.page.height - 30;
//           doc.fontSize(8)
//              .fillColor(colors.textLight)
//              .font('Helvetica')
//              .text('Generated by LNG', margins.left, footerY, {
//                align: 'center',
//                width: pageWidth
//              });
//         }
//         isFirstPage = false;
        
//         doc.addPage();
//         return margins.top;
//       }
//       return currentY;
//     };

//     // Helper function to add header with gradient background
//     const addDocumentHeader = () => {
//       // Add gradient background for header
//       doc.rect(0, 0, doc.page.width, 90)  // Reduced height
//          .fill(colors.primary);

//       // Add header content
//       doc.fontSize(20)  // Reduced size
//          .fillColor(colors.white)
//          .font('Helvetica-Bold')
//          .text('USER PROFILE', margins.left, 25, { align: 'left' });

//       doc.fontSize(9)  // Reduced size
//          .fillColor(colors.white)
//          .font('Helvetica')
         

//       // Add user name in header
//       doc.fontSize(12)  // Reduced size
//          .fillColor(colors.white)
//          .font('Helvetica-Bold')
//          .text(safeValue(user.name), margins.left, 65);

//       return 95;  // Reduced from original
//     };

//     // Helper function to add section title
//     const addSectionTitle = (title, y) => {
//       y = checkPageBreak(y, 25);  // Reduced height requirement
      
//       // Add some space before new section if not at top of page
//       if (y > margins.top + 30) {
//         y += spacing.mediumGap;
//       }
      
//       doc.fontSize(13)  // Reduced size
//          .fillColor(colors.primary)
//          .font('Helvetica-Bold')
//          .text(title, margins.left, y);

//       // Add underline
//       doc.moveTo(margins.left, y + 12)  // Reduced length
//          .lineTo(margins.left + 120, y + 12)
//          .stroke(colors.primary);

//       return y + spacing.sectionTitle;
//     };

//     // Optimized table creation function
//     const createTable = (data, y, title = null) => {
//       if (!data || data.length === 0) return y;

//       // Calculate required height more precisely
//       const rowHeight = 20;  // Reduced from original
//       const headerHeight = title ? 20 : 0;
//       const totalHeight = headerHeight + (data.length * rowHeight) + 10;
      
//       y = checkPageBreak(y, totalHeight);

//       const tableWidth = pageWidth;
//       const labelWidth = tableWidth * 0.35;
//       const valueWidth = tableWidth * 0.65;

//       // Draw table background
//       doc.rect(margins.left, y, tableWidth, totalHeight)
//          .fill(colors.accent)
//          .stroke(colors.border);

//       let currentY = y + 6;  // Reduced padding

//       // Add table title if provided
//       if (title) {
//         doc.fontSize(10)  // Reduced size
//            .fillColor(colors.text)
//            .font('Helvetica-Bold')
//            .text(title, margins.left + 8, currentY);
//         currentY += headerHeight;
//       }

//       // Add table rows
//       data.forEach((row, index) => {
//         const [label, value] = row;
//         const formattedValue = safeValue(value);

//         // Alternate row background
//         if (index % 2 === 0) {
//           doc.rect(margins.left + 2, currentY - 2, tableWidth - 4, rowHeight)
//              .fill(colors.white)
//              .stroke(colors.border);
//         }

//         // Add label (left column)
//         doc.fontSize(8)
//            .fillColor(colors.textLight)
//            .font('Helvetica-Bold')
//            .text(label + ':', margins.left + 8, currentY + 3, {
//              width: labelWidth - 12,
//              height: rowHeight - 6,
//              ellipsis: true
//            });

//         // Add vertical separator
//         doc.moveTo(margins.left + labelWidth, currentY - 2)
//            .lineTo(margins.left + labelWidth, currentY + rowHeight - 2)
//            .stroke(colors.border);

//         // Add value (right column)
//         doc.fontSize(8)
//            .fillColor(colors.text)
//            .font('Helvetica')
//            .text(formattedValue, margins.left + labelWidth + 8, currentY + 3, {
//              width: valueWidth - 12,
//              height: rowHeight - 6,
//              ellipsis: true
//            });

//         currentY += rowHeight;
//       });

//       return currentY + spacing.tableBottom;
//     };

//     // Optimized info card creation
//     const createInfoCard = (title, content, y, bgColor = colors.white) => {
//       if (!content || content.length === 0) return y;

//       const cardHeight = 40 + (content.length * 15);  // Reduced heights
//       y = checkPageBreak(y, cardHeight);

//       // Draw card
//       doc.rect(margins.left, y, pageWidth, cardHeight)
//          .fill(bgColor)
//          .stroke(colors.border);

//       // Add card title
//       doc.fontSize(9)
//          .fillColor(colors.primary)
//          .font('Helvetica-Bold')
//          .text(title, margins.left + 12, y + 8);

//       let contentY = y + 22;  // Reduced spacing
//       content.forEach(item => {
//         const text = safeValue(item);
//         doc.fontSize(7)
//            .fillColor(colors.text)
//            .font('Helvetica')
//            .text(`• ${text}`, margins.left + 12, contentY, {
//              width: pageWidth - 24
//            });
//         contentY += 15;  // Reduced spacing
//       });

//       return y + cardHeight + spacing.cardBottom;
//     };

//     // Start generating PDF
//     let yPos = addDocumentHeader();

//     // Basic Information Section
//     yPos = addSectionTitle('BASIC INFORMATION', yPos);
//     const profileData = [
//       ['Full Name', user.name],
//       ['Email Address', user.email],
//       ['Mobile Number', user.mobile_number],
//       ['Role/Position', user.meeting_role],
//       ['Chapter', user.chapter_name],
//       ['Points Earned', user.points],
//       ['Address', user.address],
//       ['Introduction', user.introduction_details]
//     ];
//     yPos = createTable(profileData, yPos, 'Personal Details');

//     // Business Information Section
//     if (user.business?.length > 0) {
//       const business = user.business[0];
//       yPos = addSectionTitle('BUSINESS INFORMATION', yPos);
//       const businessData = [
//         ['Business Name', business.business_name],
//         ['Business Type', business.business_type],
//         ['Category', business.category],
//         ['Sub-Category', business.sub_category],
//         ['Product/Service', business.product || business.service],
//         ['Formation Type', business.formation],
//         ['Established Date', formatDate(business.establishment)],
//         ['Team Size', business.team_size],
//         ['Business Email', business.email],
//         ['Business Phone', business.mobile_number],
//         ['Website', business.website],
//         ['Business Address', business.address],
//         ['Description', business.about_business_details]
//       ];
//       yPos = createTable(businessData, yPos, 'Business Details');
//     }

//     // Personal Bio Section
//     if (user.bioDetails) {
//       yPos = addSectionTitle('PERSONAL BIOGRAPHY', yPos);
//       const bioData = [
//         ['Spouse', user.bioDetails.spouse],
//         ['Children', user.bioDetails.children],
//         ['Pets', user.bioDetails.pets],
//         ['City of Residence', user.bioDetails.cityOfResidence],
//         ['Years in Current City', user.bioDetails.yearInThatCity],
//         ['Years in Business', user.bioDetails.yearsInBusiness],
//         ['Hobbies & Interests', user.bioDetails.hobbies],
//         ['Previous Business Types', user.bioDetails.previousTypesOfBusiness],
//         ['Burning Desire', user.bioDetails.myBurningDesire],
//         ['Key to Success', user.bioDetails.myKeyToSuccess],
//         ['Something Unique', user.bioDetails.somethingNoOne]
//       ];
//       yPos = createTable(bioData, yPos, 'Bio Details');
//     }

//     // Professional Growth Section
//     if (user.growthSheet) {
//       yPos = addSectionTitle('PROFESSIONAL GROWTH', yPos);
//       const growthData = [
//         ['Key Accomplishments', user.growthSheet.accomplishment],
//         ['Professional Goals', user.growthSheet.goals],
//         ['Core Skills', user.growthSheet.skills],
//         ['Areas of Interest', user.growthSheet.interests],
//         ['Professional Networks', user.growthSheet.networks]
//       ];
//       yPos = createTable(growthData, yPos, 'Growth & Development');
//     }

//     // Professional Highlights Section
//     if (user.topProfile) {
//       yPos = addSectionTitle('PROFESSIONAL HIGHLIGHTS', yPos);
//       const highlightsData = [
//         ['Favorite LGN Story', user.topProfile.favouriteLgnStory],
//         ['Top Problem Solved', user.topProfile.topProblemSolved],
//         ['Top Product/Service', user.topProfile.topProduct],
//         ['Ideal Referral', user.topProfile.idealReferral],
//         ['Ideal Referral Partner', user.topProfile.idealReferralParter]
//       ];
//       yPos = createTable(highlightsData, yPos, 'Top Achievements');
//     }

//     // Presentations Section
//     if (user.weeklyPresentation) {
//       yPos = addSectionTitle('PRESENTATIONS', yPos);
//       const presentationData = [
//         ['Primary Presentation', user.weeklyPresentation.presentation1],
//         ['Secondary Presentation', user.weeklyPresentation.presentation2]
//       ];
//       yPos = createTable(presentationData, yPos, 'Weekly Presentations');
//     }

//     // Add footer to the final page
//     if (!isFirstPage) {
//       const footerY = doc.page.height - 30;
//       doc.fontSize(8)
//          .fillColor(colors.textLight)
//          .font('Helvetica')
//          .text('Generated by Professional Profile System', margins.left, footerY, {
//            align: 'center',
//            width: pageWidth
//          });
//     }

//     // Finalize the PDF
//     doc.end();

//   } catch (error) {
//     console.error('Error generating PDF:', error);
    
//     if (!res.headersSent) {
//       return response.serverError("Error generating PDF", res);
//     }
//   }
// });


const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {name,mobile_number,email,date_of_birth,meeting_role,business}= req.body;
  try {
    const updatedUser = await models.User.findByIdAndUpdate(id, {
      name,
      mobile_number,
      email,
      date_of_birth,
      meeting_role,
     
    }, { new: true });

    const user = await models.User.findById(id).select('name chapter_name mobile_number date_of_birth  meeting_role').lean();

    if (!updatedUser) {
      return response.success("User not found", null, res);
    }

    return response.success("User updated successfully", user, res);
  } catch (error) {
    console.error('Error updating user:', error);
    return response.error("Error updating user", 500, res);
  }
});

const generateUserPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user by ID
    const user = await models.User.findById(id)
      .select('name chapter_name mobile_number email date_of_birth marriage_anniversary profilePic emergency_contact address introduction_details meeting_role keywords points business bioDetails growthSheet topProfile weeklyPresentation')
      .lean();

    if (!user) {
      return response.serverError("User not found", res);
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      layout: 'portrait'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(user.name || 'user').replace(/[^a-zA-Z0-9]/g, '_')}_profile.pdf"`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Handle errors
    doc.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'PDF generation failed' });
      }
    });

    res.on('error', (error) => {
      console.error('Response error:', error);
    });

    // Warm brown color scheme
    const colors = {
      primary: '#8B4513',
      secondary: '#A0522D',
      accent: '#F5DEB3',
      border: '#D2B48C',
      text: '#5D4037',
      textLight: '#795548',
      white: '#FFFFFF',
      headerBg: '#FFF8DC',
      profileBorder: '#A0522D'
    };

    const margins = {
      left: 40,
      right: 40,
      top: 40,
      bottom: 40
    };

    const spacing = {
      sectionTitle: 22,
      tableTitle: 14,
      tableBottom: 16,
      cardBottom: 14,
      smallGap: 10,
      mediumGap: 18,
      largeGap: 28
    };

    const pageWidth = doc.page.width - margins.left - margins.right;
    let isFirstPage = true;
    let currentPageNumber = 1;

    // Helper functions
    const safeValue = (value) => {
      if (value === null || value === undefined || value === '') return 'N/A';
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value instanceof Date) return value.toLocaleDateString();
      return String(value).trim();
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
      } catch {
        return 'N/A';
      }
    };

    const addFooter = () => {
      if (!isFirstPage) {
        const footerY = doc.page.height - 35;
        doc.fontSize(10)
           .fillColor(colors.textLight)
           .font('Helvetica')
           .text('Generated by Africa_Community', margins.left, footerY, {
             align: 'center',
             width: pageWidth
           });
      }
    };

    const checkPageBreak = (currentY, requiredHeight) => {
      const remainingSpace = doc.page.height - margins.bottom - currentY;
      
      if (remainingSpace < requiredHeight) {
        // Add footer to current page before breaking
        addFooter();
        
        // Add new page
        doc.addPage();
        isFirstPage = false;
        currentPageNumber++;
        return margins.top;
      }
      return currentY;
    };

    // Header with warm brown theme
    const addDocumentHeader = () => {
      doc.rect(0, 0, doc.page.width, 110)
         .fill(colors.headerBg)
         .stroke(colors.border, 1.5);

      if (user.profilePic) {
        try {
          const profilePicPath = path.join(process.cwd(), user.profilePic);
          if (fs.existsSync(profilePicPath)) {
            //doc.circle(55, 55, 28)
            //   .fill(colors.white)
             //  .stroke(colors.profileBorder, 1.5);
            
            doc.image(profilePicPath, 27, 27, { 
              width: 56,
              height: 56,
              align: 'left',
              valign: 'top',
              fit: [56, 56]
            });
          }
        } catch (error) {
          console.error('Error adding profile picture:', error);
        }
      }

      doc.fontSize(22)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('Africa Community', margins.left + 70, 25);

      doc.fontSize(12)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(user.chapter_name || '', margins.left + 70, 60);

      doc.fontSize(16)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(safeValue(user.name), margins.left + 70, 80);

      return 120;
    };

    const addSectionTitle = (title, y) => {
      y = checkPageBreak(y, 30);
      
      if (y > margins.top + 30) {
        y += spacing.mediumGap;
      }
      
      doc.fontSize(15)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(title, margins.left, y);

      doc.moveTo(margins.left, y + 14)
         .lineTo(margins.left + 130, y + 14)
         .stroke(colors.primary, 1.5);

      return y + spacing.sectionTitle;
    };

    const createTable = (data, y, title = null) => {
      if (!data || data.length === 0) return y;

      const rowHeight = 22;
      const headerHeight = title ? 22 : 0;
      const totalHeight = headerHeight + (data.length * rowHeight) + 12;
      
      y = checkPageBreak(y, totalHeight);

      const tableWidth = pageWidth;
      const labelWidth = tableWidth * 0.35;
      const valueWidth = tableWidth * 0.65;

      doc.rect(margins.left, y, tableWidth, totalHeight)
         .fill(colors.accent)
         .stroke(colors.border, 1.5);

      let currentY = y + 8;

      if (title) {
        doc.fontSize(12)
           .fillColor(colors.text)
           .font('Helvetica-Bold')
           .text(title, margins.left + 10, currentY);
        currentY += headerHeight;
      }

      data.forEach((row, index) => {
        const [label, value] = row;
        const formattedValue = safeValue(value);

        if (index % 2 === 0) {
          doc.rect(margins.left + 2, currentY - 2, tableWidth - 4, rowHeight)
             .fill(colors.white)
             .stroke(colors.border);
        }

        doc.fontSize(10)
           .fillColor(colors.textLight)
           .font('Helvetica-Bold')
           .text(label + ':', margins.left + 10, currentY + 4, {
             width: labelWidth - 14,
             height: rowHeight - 6,
             ellipsis: true
           });

        doc.moveTo(margins.left + labelWidth, currentY - 2)
           .lineTo(margins.left + labelWidth, currentY + rowHeight - 2)
           .stroke(colors.border);

        doc.fontSize(10)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(formattedValue, margins.left + labelWidth + 10, currentY + 4, {
             width: valueWidth - 14,
             height: rowHeight - 6,
             ellipsis: true
           });

        currentY += rowHeight;
      });

      return currentY + spacing.tableBottom;
    };

    const createInfoCard = (title, content, y, bgColor = colors.white) => {
      if (!content || content.length === 0) return y;

      const cardHeight = 45 + (content.length * 18);
      y = checkPageBreak(y, cardHeight);

      doc.rect(margins.left, y, pageWidth, cardHeight)
         .fill(bgColor)
         .stroke(colors.border, 1.5);

      doc.fontSize(11)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(title, margins.left + 14, y + 10);

      let contentY = y + 26;
      content.forEach(item => {
        const text = safeValue(item);
        doc.fontSize(9)
           .fillColor(colors.text)
           .font('Helvetica')
           .text(`• ${text}`, margins.left + 14, contentY, {
             width: pageWidth - 28
           });
        contentY += 18;
      });

      return y + cardHeight + spacing.cardBottom;
    };

    // Start generating PDF
    let yPos = addDocumentHeader();

    // Basic Information Section
    yPos = addSectionTitle('BASIC INFORMATION', yPos);
    const profileData = [
      ['Full Name', user.name],
      ['Email Address', user.email],
      ['Mobile Number', user.mobile_number],
      ['Role/Position', user.meeting_role],
      ['Chapter', user.chapter_name],
      ['Points Earned', user.points],
      ['Address', user.address],
      ['Introduction', user.introduction_details]
    ];
    yPos = createTable(profileData, yPos, 'Personal Details');

    // Business Information Section
    if (user.business?.length > 0) {
      const business = user.business[0];
      yPos = addSectionTitle('BUSINESS INFORMATION', yPos);
      const businessData = [
        ['Business Name', business.business_name],
        ['Business Type', business.business_type],
        ['Category', business.category],
        ['Sub-Category', business.sub_category],
        ['Product/Service', business.product || business.service],
        ['Formation Type', business.formation],
        ['Established Date', formatDate(business.establishment)],
        ['Team Size', business.team_size],
        ['Business Email', business.email],
        ['Business Phone', business.mobile_number],
        ['Website', business.website],
        ['Business Address', business.address],
        ['Description', business.about_business_details]
      ];
      yPos = createTable(businessData, yPos, 'Business Details');
    }

    // Personal Bio Section
    if (user.bioDetails) {
      yPos = addSectionTitle('PERSONAL BIOGRAPHY', yPos);
      const bioData = [
        ['Spouse', user.bioDetails.spouse],
        ['Children', user.bioDetails.children],
        ['Pets', user.bioDetails.pets],
        ['City of Residence', user.bioDetails.cityOfResidence],
        ['Years in Current City', user.bioDetails.yearInThatCity],
        ['Years in Business', user.bioDetails.yearsInBusiness],
        ['Hobbies & Interests', user.bioDetails.hobbies],
        ['Previous Business Types', user.bioDetails.previousTypesOfBusiness],
        ['Burning Desire', user.bioDetails.myBurningDesire],
        ['Key to Success', user.bioDetails.myKeyToSuccess],
        ['Something Unique', user.bioDetails.somethingNoOne]
      ];
      yPos = createTable(bioData, yPos, 'Bio Details');
    }

    // Professional Growth Section
    if (user.groupthSheet) {
      yPos = addSectionTitle('PROFESSIONAL GROWTH', yPos);
      const growthData = [
        ['Key Accomplishments', user.growthSheet.accomplishment],
        ['Professional Goals', user.growthSheet.goals],
        ['Core Skills', user.growthSheet.skills],
        ['Areas of Interest', user.growthSheet.interests],
        ['Professional Networks', user.growthSheet.networks]
      ];
      yPos = createTable(growthData, yPos, 'Growth & Development');
    }

    // Professional Highlights Section
    if (user.topProfile) {
      yPos = addSectionTitle('PROFESSIONAL HIGHLIGHTS', yPos);
      const highlightsData = [
        ['Favorite LGN Story', user.topProfile.favouriteLgnStory],
        ['Top Problem Solved', user.topProfile.topProblemSolved],
        ['Top Product/Service', user.topProfile.topProduct],
        ['Ideal Referral', user.topProfile.idealReferral],
        ['Ideal Referral Partner', user.topProfile.idealReferralParter]
      ];
      yPos = createTable(highlightsData, yPos, 'Top Achievements');
    }

    // Presentations Section - Fixed to prevent blank page
    if (user.weeklyPresentation) {
      yPos = addSectionTitle('PRESENTATIONS', yPos);
      const presentationData = [
        ['Primary Presentation', user.weeklyPresentation.presentation1],
        ['Secondary Presentation', user.weeklyPresentation.presentation2]
      ];
      
      yPos = createTable(presentationData, yPos, 'Weekly Presentations');
    }

    // Add final footer
    addFooter();

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (!res.headersSent) {
      return response.serverError("Error generating PDF", res);
    }
  }
});


const generateBulkMemberApplicationsPDF = asyncHandler(async (req, res) => {
  try {
    const applications = await models.memberApplication.find({}).lean();

    if (!applications.length) {
      return res.status(404).json({ error: 'No applications found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="Africa_Community_Member_Applications.zip"');
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    
    // Process in smaller batches for better memory management
    const batchSize = 3;
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      await Promise.all(batch.map(application => 
        generateApplicationPDF(application, archive)
      ));
    }

    await archive.finalize();

  } catch (error) {
    console.error('Bulk PDF generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate bulk PDFs' });
    }
  }
});

async function generateApplicationPDF(application, archive) {
  return new Promise((resolve, reject) => {
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margin: 40,
      layout: 'portrait',
      bufferPages: true // Important for multi-page handling
    });

    const fileName = `Africa_Community_Application_${application.applicant?.firstName || 'Unknown'}_${
      application.applicant?.lastName || 'User'}.pdf`;
    
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      archive.append(Buffer.concat(chunks), { name: fileName });
      resolve();
    });
    pdfDoc.on('error', reject);

    generatePDFContent(pdfDoc, application);
    pdfDoc.end();
  });
}

function generatePDFContent(pdfDoc, application) {
  const colors = {
    primary: '#2c3e50',
    secondary: '#3498db',
    accent: '#ecf0f1',
    border: '#bdc3c7',
    text: '#2c3e50',
    textLight: '#7f8c8d',
    white: '#FFFFFF',
    headerBg: '#f8f9fa'
  };

  const margins = { left: 40, right: 40, top: 40, bottom: 40 };
  const pageWidth = pdfDoc.page.width - margins.left - margins.right;
  let currentY = margins.top;

  // Improved text formatting functions
  const safeValue = (value) => {
    if (value === null || value === undefined || value === '') return 'Not Provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value).trim();
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') return 'Not Provided';
    return [
      address.addressLine1,
      address.addressLine2,
      `${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''}`,
      address.postalCode
    ].filter(Boolean).join('\n');
  };

  const formatReference = (ref) => {
    if (!ref || !ref.firstName) return 'Not Provided';
    return [
      `Name: ${ref.firstName} ${ref.lastName || ''}`,
      `Business: ${ref.businessName || 'Not Provided'}`,
      `Phone: ${ref.phone || 'Not Provided'}`,
      `Email: ${ref.email || 'Not Provided'}`,
      `Relationship: ${ref.relationship || 'Not Provided'}`
    ].join('\n');
  };

  // Header Section
  function addHeader() {
    pdfDoc.rect(0, 0, pdfDoc.page.width, 80)
       .fill(colors.headerBg)
       .stroke(colors.border, 1);

    pdfDoc.fontSize(20)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Africa Community APPLICATION', margins.left, 30);

    pdfDoc.fontSize(12)
       .fillColor(colors.textLight)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleDateString()}`, margins.left, 55);

    return 90;
  }

  // Improved section generator with better spacing
  function addSection(title, rows, options = {}) {
    const { columnWidth = [0.4, 0.6], gap = 10 } = options;
    currentY = checkPageBreak(currentY, 30 + (rows.length * 20) + gap);
    
    // Section Title
    pdfDoc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(title.toUpperCase(), margins.left, currentY);

    currentY += 20;

    // Section Content with better field spacing
    rows.forEach(([label, value], index) => {
      const rowHeight = calculateRowHeight(value, columnWidth[1] * pageWidth - 20);
      
      if (currentY + rowHeight > pdfDoc.page.height - margins.bottom) {
        pdfDoc.addPage();
        currentY = margins.top;
      }

      // Alternate row background
      if (index % 2 === 0) {
        pdfDoc.rect(margins.left + 2, currentY - 2, pageWidth - 4, rowHeight)
           .fill(colors.white)
           .stroke(colors.border, 0.3);
      }

      // Label
      pdfDoc.fontSize(10)
         .fillColor(colors.textLight)
         .font('Helvetica-Bold')
         .text(`${label}:`, margins.left + 10, currentY + 6, {
           width: columnWidth[0] * pageWidth - 14,
           lineGap: 4
         });

      // Value with multi-line support
      pdfDoc.fontSize(10)
         .fillColor(colors.text)
         .font('Helvetica')
         .text(safeValue(value), margins.left + columnWidth[0] * pageWidth + 10, currentY + 6, {
           width: columnWidth[1] * pageWidth - 14,
           lineGap: 4
         });

      currentY += rowHeight;
    });

    return currentY + gap;
  }

  function calculateRowHeight(value, maxWidth) {
    const lineHeight = 14;
    const test = pdfDoc.font('Helvetica').fontSize(10);
    const height = test.heightOfString(safeValue(value), { width: maxWidth });
    return Math.max(20, height + 10); // Minimum row height of 20
  }

  function checkPageBreak(y, needed) {
    if (y + needed > pdfDoc.page.height - margins.bottom) {
      pdfDoc.addPage();
      return margins.top;
    }
    return y;
  }

  function addFooter() {
    const footerY = pdfDoc.page.height - 30;
    pdfDoc.fontSize(9)
       .fillColor(colors.textLight)
       .text('Africa_Community Confidential - For Internal Use Only', margins.left, footerY, {
         align: 'center',
         width: pageWidth
       });
  }

  // Start PDF Generation
  currentY = addHeader();

  // Application Type Section
  currentY = addSection('Application Details', [
    ['User Type', application.userType],
    ['Chapter', application.chapter],
    ['Region', application.region],
    ['Invited By', application.invitedBy],
    ['First Visit Date', application.visitDate ? new Date(application.visitDate).toLocaleDateString() : 'Not Provided'],
    ['How You Heard About Africa_Community', application.howHeardAbout || 'Not Provided']
  ]);

  // Applicant Information - Split into two sections for better layout
  currentY = addSection('Applicant Personal Information', [
    ['First Name', application.applicant.firstName],
    ['Last Name', application.applicant.lastName],
    ['Email', application.applicant.email],
    ['Mobile Number', application.applicant.mobileNumber],
    ['Secondary Phone', application.applicant.secondaryPhone || 'Not Provided'],
    ['Aadhaar Number', application.applicant.adhaarNumber || 'Not Provided']
  ], { columnWidth: [0.5, 0.5] });

  currentY = addSection('Applicant Professional Information', [
    ['Company Name', application.applicant.companyName || 'Not Provided'],
    ['Industry', application.applicant.industry || 'Not Provided'],
    ['Professional Classification', application.applicant.professionalClassification || 'Not Provided'],
    ['Business Website', application.applicant.businessWebsite || 'Not Provided'],
    ['GST Number', application.applicant.gstNumber || 'Not Provided']
  ], { columnWidth: [0.5, 0.5] });

  // Business Address - Given its own section for better display
  currentY = addSection('Business Address', [
    ['Full Address', formatAddress(application.applicant.businessAddress)]
  ], { columnWidth: [0.3, 0.7] });

  // Professional Experience
  currentY = addSection('Professional Experience', [
    ['Experience Description', application.experience.description || 'Not Provided'],
    ['Years of Experience', application.experience.lengthOfTime || 'Not Provided'],
    ['Education', application.experience.education || 'Not Provided'],
    ['License Ever Revoked', application.experience.licenseRevoked || 'No'],
    ['Primary Occupation', application.experience.isPrimaryOccupation || 'Yes']
  ]);

  // Standards
  currentY = addSection('Commitment Standards', [
    ['Regular Meeting Attendance', application.standards.commitmentToMeetings || 'Yes'],
    ['Provide Substitutes When Absent', application.standards.commitmentToSubstitute || 'Yes'],
    ['Provide Quality Referrals', application.standards.commitmentToReferrals || 'Yes'],
    ['Referral Ability (1-10)', application.standards.referralAbility || '5']
  ]);

  // References - Each reference gets its own subsection
  currentY = addSection('Business Reference 1', [
    ['Details', formatReference(application.references.reference1)]
  ], { columnWidth: [0.2, 0.8] });

  currentY = addSection('Business Reference 2', [
    ['Details', formatReference(application.references.reference2)]
  ], { columnWidth: [0.2, 0.8] });

  currentY = addSection('Reference Verification', [
    ['References Informed About This Application', 
     application.references.informedReferences ? 'Yes' : 'No']
  ]);

  // Terms and Status
  addSection('Application Status', [
    ['Terms Accepted', application.termsAccepted ? 'Yes' : 'No'],
    ['Account Status', application.isActive ? 'Active' : 'Inactive'],
    ['Event Registration Included', application.eventRegistration ? 'Yes' : 'No'],
    ['Application Date', new Date(application.createdAt).toLocaleDateString()]
  ]);

  addFooter();
}



export { getAllUsers, deleteUser, generateUserPDF ,generateBulkMemberApplicationsPDF};
export const userController={
    getAllUsers,
    generateBulkMemberApplicationsPDF,
    deleteUser,
    updateUser,
    isActiveStatus,
    generateUserPDF,
    upload,
    //generateMemberApplicationPDF,
    importUsersFromExcel,
    importTestimonialsFromExcel,
    importReferralsFromExcel,
    importOneToOneFromExcel,
    importTyfcbFromExcel
    
}


