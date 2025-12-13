// controllers/chapterFinanceController.js
import { models } from '../../models/zindex.js';
import { response } from '../../utils/response.js';
import asyncHandler from 'express-async-handler';
import moment from 'moment-timezone';

// Set IST timezone
const IST = 'Asia/Kolkata';

// Update collections (Treasurer only)
const addCollection = asyncHandler(async (req, res) => {
  const { userId, chapter, amount, description = "" } = req.body;

  if (!userId || !chapter || amount === undefined) {
    return response.error("Provide userId, chapter, and amount", 500, res);
  }

  // Validate amount
  const collectionAmount = parseFloat(amount);
  if (isNaN(collectionAmount) || collectionAmount <= 0) {
    return response.error("Amount must be a positive number", 400, res);
  }

  // Check if user is treasurer of this chapter
  const user = await models.Admin.findById(userId);
  if (!user || (user.chapter !== chapter && user.chapter !== 'All')) {
    return response.unauthorized("You are not authorized to add collections for this chapter", res);
  }

  let chapterFinance = await models.ChapterFinance.findOne({ chapter });
  
  if (!chapterFinance) {
    // Create new entry if doesn't exist
    chapterFinance = await models.ChapterFinance.create({
      chapter,
      totalCollections: collectionAmount,
      collectionHistory: [{
        amount: collectionAmount,
        description: description || "Initial collection",
        collectedBy: userId,
        collectedAt: moment().tz(IST).toDate()
      }],
      lastUpdatedBy: userId,
      updatedAt: moment().tz(IST).toDate()
    });
  } else {
    // Update existing entry with incremental addition
    chapterFinance.totalCollections += collectionAmount;
    
    // Add to collection history
    chapterFinance.collectionHistory.push({
      amount: collectionAmount,
      description,
      collectedBy: userId,
      collectedAt: moment().tz(IST).toDate()
    });

    chapterFinance.lastUpdatedBy = userId;
    chapterFinance.updatedAt = moment().tz(IST).toDate();
    await chapterFinance.save();
  }

  return response.success(
    `Collection of ₹${collectionAmount} added successfully! Total collections: ₹${chapterFinance.totalCollections}`,
    { 
      chapterFinance,
      addedAmount: collectionAmount,
      newTotal: chapterFinance.totalCollections 
    }, 
    res
  );
});


const getCollectionHistory = asyncHandler(async (req, res) => {
  const { chapter} = req.body;
  const { page = 1, limit = 10 } = req.query;

  if (!chapter) {
    return response.error("Provide chapter name", 400, res);
  }

  const chapterFinance = await models.ChapterFinance.findOne({ chapter })
    .populate('collectionHistory.collectedBy', 'name email')
    .select('collectionHistory totalCollections');

  if (!chapterFinance) {
    return response.success("No collection history found", { 
      totalCollections: 0,
      collectionHistory: [],
      pagination: { page: 1, totalPages: 0, totalEntries: 0 }
    }, res);
  }

  // Paginate the collection history manually
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Sort by latest first and paginate
  const sortedHistory = chapterFinance.collectionHistory
    .slice()
    .sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt));
  
  const paginatedHistory = sortedHistory.slice(startIndex, endIndex);

  // Format dates for better readability
  const formattedHistory = paginatedHistory.map(entry => ({
    ...entry.toObject(),
    collectedAt: moment(entry.collectedAt).tz(IST).format('DD MMM YYYY, hh:mm A')
  }));

  const totalPages = Math.ceil(chapterFinance.collectionHistory.length / limit);

  return response.success("Collection history fetched successfully!", {
    totalCollections: chapterFinance.totalCollections,
    collectionHistory: formattedHistory,
    pagination: {
      page: parseInt(page),
      totalPages,
      totalEntries: chapterFinance.collectionHistory.length,
      hasNext: endIndex < chapterFinance.collectionHistory.length,
      hasPrev: startIndex > 0
    }
  }, res);
});

// Remove last collection entry (for correction)
const removeLastCollection = asyncHandler(async (req, res) => {
  const { userId, chapter, reason = "Correction" } = req.body;

  if (!userId || !chapter) {
    return response.error("Provide userId and chapter", 500, res);
  }

  // Check if user is treasurer of this chapter
  const user = await models.Admin.findById(userId);
  if (!user || (user.chapter !== chapter && user.chapter !== 'All')) {
    return response.unauthorized("You are not authorized to modify collections for this chapter", res);
  }

  const chapterFinance = await models.ChapterFinance.findOne({ chapter });
  
  if (!chapterFinance || chapterFinance.collectionHistory.length === 0) {
    return response.notFound("No collection entries to remove", res);
  }

  const lastEntry = chapterFinance.collectionHistory[chapterFinance.collectionHistory.length - 1];
  const removedAmount = lastEntry.amount;

  // Update total and remove last entry
  chapterFinance.totalCollections -= removedAmount;
  chapterFinance.collectionHistory.pop();

  chapterFinance.lastUpdatedBy = userId;
  chapterFinance.updatedAt = moment().tz(IST).toDate();
  await chapterFinance.save();

  return response.success(
    `Last collection of ₹${removedAmount} removed successfully! New total: ₹${chapterFinance.totalCollections}`,
    { 
      chapterFinance,
      removedAmount,
      newTotal: chapterFinance.totalCollections 
    }, 
    res
  );
});


// Add expense (Treasurer only)
const addExpense = asyncHandler(async (req, res) => {
  const { userId, chapter, category, customCategory, amount, description } = req.body;

  if (!userId || !chapter || !category || !amount || !description) {
    return response.error("Provide all required fields: userId, chapter, category, amount, description", res);
  }

  // Check if user is treasurer of this chapter
  const user = await models.Admin.findById(userId);
  if (!user || (user.chapter !== chapter && user.chapter !== 'All')) {
    return response.unauthorized("You are not authorized to add expenses for this chapter", res);
  }

  let chapterFinance = await models.ChapterFinance.findOne({ chapter });
  
  if (!chapterFinance) {
    return response.notFound("Chapter finance record not found. Please update collections first.", res);
  }

  // Handle file upload
  let receiptPath = "";
  if (req.file) {
    receiptPath = req.file.path.replace(/\\/g, '/');
  }

  const expense = {
    category,
    customCategory: category === 'Other' ? customCategory : "",
    amount: parseFloat(amount),
    description,
    receipt: receiptPath,
    createdBy: userId,
    createdAt: moment().tz(IST).toDate()
  };

  chapterFinance.expenses.push(expense);
  chapterFinance.lastUpdatedBy = userId;
  chapterFinance.updatedAt = moment().tz(IST).toDate();
  
  await chapterFinance.save();

  return response.success("Expense added successfully!", { chapterFinance }, res);
});

// Get chapter finance summary (Members can view)
const getChapterFinanceSummary = asyncHandler(async (req, res) => {
  const { chapter,  expensePage = 1, expenseLimit = 10 } = req.body;
  const { page = 1, limit = 10 } = req.query;

  if (!chapter) {
    return response.error("Provide chapter name", res);
  }

  // Find the chapter finance document
  const chapterFinance = await models.ChapterFinance.findOne({ chapter })
    .populate('expenses.createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('collectionHistory.collectedBy', 'name email')
    .lean();

  if (!chapterFinance) {
    return response.success("No finance records found for this chapter", { 
      totalCollections: 0,
      totalExpenses: 0,
      balance: 0,
      expenses: [],
      collectionHistory: [],
      pagination: {
        page: parseInt(expensePage),
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        totalExpenses: 0
      }
    }, res);
  }

  // Calculate virtual fields manually since we're using lean()
  const totalExpenses = chapterFinance.expenses.reduce((total, expense) => total + expense.amount, 0);
  const balance = chapterFinance.totalCollections - totalExpenses;

  // Manual pagination for expenses
  const expensePageNum = parseInt(expensePage);
  const expenseLimitNum = parseInt(expenseLimit);
  const startIndex = (expensePageNum - 1) * expenseLimitNum;
  const endIndex = expensePageNum * expenseLimitNum;

  // Sort expenses by latest first
  const sortedExpenses = chapterFinance.expenses
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const paginatedExpenses = sortedExpenses.slice(startIndex, endIndex);

  // Format dates for expenses
  const formattedExpenses = paginatedExpenses.map(expense => ({
    ...expense,
    createdAt: moment(expense.createdAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
    category: expense.category === 'Other' && expense.customCategory 
      ? expense.customCategory 
      : expense.category
  }));

  // Format collection history (show latest 5)
  const formattedCollectionHistory = chapterFinance.collectionHistory
    .sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt))
    .slice(0, 5)
    .map(collection => ({
      ...collection,
      collectedAt: moment(collection.collectedAt).tz(IST).format('DD MMM YYYY, hh:mm A')
    }));

  const totalExpensePages = Math.ceil(chapterFinance.expenses.length / expenseLimitNum);
  const hasNextExpensePage = endIndex < chapterFinance.expenses.length;
  const hasPrevExpensePage = startIndex > 0;

  return response.success("Chapter finance data fetched successfully!", {
    chapter: chapterFinance.chapter,
    totalCollections: chapterFinance.totalCollections,
    totalExpenses,
    balance,
   // lastUpdated: moment(chapterFinance.updatedAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
    //lastUpdatedBy: chapterFinance.lastUpdatedBy,
    expenses: formattedExpenses,
    //collectionHistory: formattedCollectionHistory,
    pagination: {
      page: expensePageNum,
      totalPages: totalExpensePages,
      hasNextPage: hasNextExpensePage,
      hasPrevPage: hasPrevExpensePage,
      totalExpenses: chapterFinance.expenses.length
    }
  }, res);
});


// Get expense by ID
const getExpenseById = asyncHandler(async (req, res) => {
  const { expenseId, chapter } = req.body;

  if (!expenseId || !chapter) {
    return response.error("Provide expenseId and chapter", res);
  }

  const chapterFinance = await models.ChapterFinance.findOne({ 
    chapter,
    'expenses._id': expenseId 
  }).populate('expenses.createdBy', 'name email');

  if (!chapterFinance) {
    return response.notFound("Expense not found", res);
  }

  const expense = chapterFinance.expenses.id(expenseId);
  if (!expense) {
    return response.notFound("Expense not found", res);
  }

  const formattedExpense = {
    ...expense.toObject(),
    createdAt: moment(expense.createdAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
    category: expense.category === 'Other' && expense.customCategory 
      ? expense.customCategory 
      : expense.category
  };

  return response.success("Expense details fetched successfully!", { expense: formattedExpense }, res);
});

// Update expense (Treasurer only)
const updateExpense = asyncHandler(async (req, res) => {
  const { userId, chapter, expenseId, category, customCategory, amount, description } = req.body;

  if (!userId || !chapter || !expenseId) {
    return response.error("Provide userId, chapter, and expenseId",500, res);
  }

  // Check if user is treasurer of this chapter
  const user = await models.Admin.findById(userId);
  if (!user || (user.chapter !== chapter && user.chapter !== 'All')) {
    return response.unauthorized("You are not authorized to update expenses for this chapter",500, res);
  }

  const chapterFinance = await models.ChapterFinance.findOne({ chapter });
  if (!chapterFinance) {
    return response.notFound("Chapter finance record not found", 500,res);
  }

  const expense = chapterFinance.expenses.id(expenseId);
  if (!expense) {
    return response.notFound("Expense not found", 500,res);
  }

  // Update fields if provided
  if (category) expense.category = category;
  if (customCategory !== undefined) expense.customCategory = customCategory;
  if (amount !== undefined) expense.amount = parseFloat(amount);
  if (description !== undefined) expense.description = description;

  // Handle receipt update if file is uploaded
  if (req.file) {
    expense.receipt = req.file.path.replace(/\\/g, '/');
  }

  chapterFinance.lastUpdatedBy = userId;
  chapterFinance.updatedAt = moment().tz(IST).toDate();
  
  await chapterFinance.save();

  return response.success("Expense updated successfully!", { chapterFinance }, res);
});

// Delete expense (Treasurer only)
const deleteExpense = asyncHandler(async (req, res) => {
  const { userId, chapter, expenseId } = req.body;

  if (!userId || !chapter || !expenseId) {
    return response.error("Provide userId, chapter, and expenseId", 500,res);
  }

  // Check if user is treasurer of this chapter
  const user = await models.Admin.findById(userId);
  if (!user || (user.chapter !== chapter && user.chapter !== 'All')) {
    return response.unauthorized("You are not authorized to delete expenses for this chapter", res);
  }

  const chapterFinance = await models.ChapterFinance.findOne({ chapter });
  if (!chapterFinance) {
    return response.notFound("Chapter finance record not found",500, res);
  }

  const expenseIndex = chapterFinance.expenses.findIndex(exp => exp._id.toString() === expenseId);
  if (expenseIndex === -1) {
    return response.notFound("Expense not found", 401, res);
  }

  chapterFinance.expenses.splice(expenseIndex, 1);
  chapterFinance.lastUpdatedBy = userId;
  chapterFinance.updatedAt = moment().tz(IST).toDate();
  
  await chapterFinance.save();

  return response.success("Expense deleted successfully!", { chapterFinance }, res);
});

// Get chapter finance summary (Includes collections, expenses, and balance)
const getChapterFinance = asyncHandler(async (req, res) => {
  const { chapter, page = 1, limit = 10 } = req.body;

  if (!chapter) {
    return response.error("Provide chapter name", 400, res);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      {
        path: 'expenses.createdBy',
        select: 'name email'
      },
      {
        path: 'lastUpdatedBy',
        select: 'name email'
      },
      {
        path: 'collectionHistory.collectedBy',
        select: 'name email'
      }
    ],
    lean: true
  };

  const result = await models.ChapterFinance.paginate({ chapter }, options);

  if (!result.docs.length) {
    return response.success("No finance records found for this chapter", { 
      totalCollections: 0,
      totalExpenses: 0,
      balance: 0,
      expenses: [],
      collectionHistory: []
    }, res);
  }

  const financeData = result.docs[0];
  
  // Format dates for better readability
  const formattedData = {
    ...financeData,
    updatedAt: moment(financeData.updatedAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
    expenses: financeData.expenses.map(expense => ({
      ...expense,
      createdAt: moment(expense.createdAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
      category: expense.category === 'Other' && expense.customCategory 
        ? expense.customCategory 
        : expense.category
    })),
    collectionHistory: financeData.collectionHistory.map(collection => ({
      ...collection,
      collectedAt: moment(collection.collectedAt).tz(IST).format('DD MMM YYYY, hh:mm A')
    })).sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt)) // Latest first
  };

  return response.success("Chapter finance data fetched successfully!", {
    chapter: formattedData.chapter,
    totalCollections: formattedData.totalCollections,
    totalExpenses: formattedData.totalExpenses,
    balance: formattedData.balance,
    lastUpdated: formattedData.updatedAt,
    lastUpdatedBy: formattedData.lastUpdatedBy,
    expenses: formattedData.expenses,
    collectionHistory: formattedData.collectionHistory.slice(0, 5), // Show last 5 collections
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      totalExpenses: result.totalDocs
    }
  }, res);
});

// controllers/chapterFinanceController.js - Updated function with filtering

const getOverallFinanceSummary = asyncHandler(async (req, res) => {
  try {
    const { chapters } = req.body; // Expecting an array of chapter names
    
    // Build query for filtering
    let query = {};
    if (chapters && Array.isArray(chapters) && chapters.length > 0) {
      query = { chapter: { $in: chapters } };
    }

    // Get chapter finance records with optional filtering
    const allChaptersFinance = await models.ChapterFinance.find(query)
      .populate('lastUpdatedBy', 'name email')
      .lean();

    if (allChaptersFinance.length === 0) {
      return response.success(
        chapters ? "No finance records found for the specified chapters" : "No finance records found",
        { 
          summary: {
            totalCollections: 0,
            totalExpenses: 0,
            totalBalance: 0,
            totalChapters: 0
          },
          chapterWiseBreakdown: [],
          overview: {
            averageCollectionPerChapter: 0,
            averageExpensePerChapter: 0,
            collectionToExpenseRatio: 'N/A'
          },
          filters: {
            applied: chapters || "All chapters",
            chapterCount: allChaptersFinance.length
          }
        }, 
        res
      );
    }

    // Calculate totals across filtered chapters
    let totalCollections = 0;
    let totalExpenses = 0;
    let totalBalance = 0;
    
    const chapterWiseSummary = allChaptersFinance.map(chapter => {
      const chapterExpenses = chapter.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const chapterBalance = chapter.totalCollections - chapterExpenses;
      
      // Add to overall totals
      totalCollections += chapter.totalCollections;
      totalExpenses += chapterExpenses;
      totalBalance += chapterBalance;

      return {
        chapter: chapter.chapter,
        collections: chapter.totalCollections,
        expenses: chapterExpenses,
        balance: chapterBalance,
        lastUpdated: moment(chapter.updatedAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
        lastUpdatedBy: chapter.lastUpdatedBy
      };
    });

    // Sort chapters by name for consistent ordering
    chapterWiseSummary.sort((a, b) => a.chapter.localeCompare(b.chapter));

    return response.success("Overall finance summary fetched successfully!", {
      summary: {
        totalCollections,
        totalExpenses,
        totalBalance,
        totalChapters: allChaptersFinance.length
      },
      chapterWiseBreakdown: chapterWiseSummary,
      overview: {
        averageCollectionPerChapter: totalCollections / allChaptersFinance.length,
        averageExpensePerChapter: totalExpenses / allChaptersFinance.length,
        collectionToExpenseRatio: totalExpenses > 0 ? (totalCollections / totalExpenses).toFixed(2) : 'N/A'
      },
      filters: {
        applied: chapters && chapters.length > 0 ? chapters : "All chapters",
        chapterCount: allChaptersFinance.length
      }
    }, res);

  } catch (error) {
    console.error("Error fetching overall summary:", error);
    return response.error("Failed to fetch overall finance summary", 500, res);
  }
});

const getChapterFinanceMobile = asyncHandler(async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.body;

  const user = userId ? (await models.User.findById(userId)) : null;
  const chapter = user.chapter_name;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      {
        path: 'expenses.createdBy',
        select: 'name email'
      },
      {
        path: 'lastUpdatedBy',
        select: 'name email'
      },
      {
        path: 'collectionHistory.collectedBy',
        select: 'name email'
      }
    ],
    lean: true
  };

  const result = await models.ChapterFinance.paginate({ chapter }, options);

  if (!result.docs.length) {
    return response.success("No finance records found for this chapter", { 
      totalCollections: 0,
      totalExpenses: 0,
      totalBalance: 0,
      expenses: [],
      collectionHistory: []
    }, res);
  }

  const financeData = result.docs[0];
  
  // Calculate total expenses from expenses array
  const totalExpenses = financeData.expenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate total balance (collections - expenses)
  const totalBalance = financeData.totalCollections - totalExpenses;

  // Format dates for better readability
  const formattedData = {
    ...financeData,
    updatedAt: moment(financeData.updatedAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
    expenses: financeData.expenses.map(expense => ({
      ...expense,
      createdAt: moment(expense.createdAt).tz(IST).format('DD MMM YYYY, hh:mm A'),
      category: expense.category === 'Other' && expense.customCategory 
        ? expense.customCategory 
        : expense.category
    })),
    collectionHistory: financeData.collectionHistory.map(collection => ({
      ...collection,
      collectedAt: moment(collection.collectedAt).tz(IST).format('DD MMM YYYY, hh:mm A')
    })).sort((a, b) => new Date(b.collectedAt) - new Date(a.collectedAt)) // Latest first
  };

  return response.success("Chapter finance data fetched successfully!", {
    chapter: formattedData.chapter,
    totalCollections: formattedData.totalCollections,
    totalExpenses: totalExpenses, // Add calculated total expenses
    totalBalance: totalBalance,   // Add calculated balance
    lastUpdated: formattedData.updatedAt,
    lastUpdatedBy: formattedData.lastUpdatedBy,
    expenses: formattedData.expenses,
    collectionHistory: formattedData.collectionHistory.slice(0, 5), // Show last 5 collections
    pagination: {
      page: result.page,
      totalPages: result.totalPages,
      totalExpenses: result.totalDocs
    }
  }, res);
});

export const chapterFinanceController = {
  
  addCollection,
  addExpense,
  getChapterFinanceMobile,
  getCollectionHistory,

  getChapterFinanceSummary,
  getChapterFinance,
  removeLastCollection,
  getCollectionHistory,
  getOverallFinanceSummary,
  getExpenseById,
  updateExpense,
  deleteExpense
};