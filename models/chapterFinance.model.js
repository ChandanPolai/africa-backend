// // models/ChapterFinance.js
// import mongoose from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";

// const expenseSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     required: true,
//     enum: ['Venue', 'Food', 'Printing', 'Admin', 'Misc', 'Other']
//   },
//   customCategory: {
//     type: String,
//     default: ""
//   },
//   amount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   description: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   receipt: {
//     type: String, // URL to uploaded file
//     default: ""
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin',
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const chapterFinanceSchema = new mongoose.Schema({
//   chapter: {
//     type: String,
//     enum: ['Achiever', 'Believer', 'Creator', 'Dreamer', 'Elevator'],
//     required: true,
//     unique: true
//   },
//   totalCollections: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   expenses: [expenseSchema],
//   lastUpdatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin',
//     required: true
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// chapterFinanceSchema.virtual('totalExpenses').get(function() {
//   return this.expenses.reduce((total, expense) => total + expense.amount, 0);
// });

// chapterFinanceSchema.virtual('balance').get(function() {
//   return this.totalCollections - this.totalExpenses;
// });

// chapterFinanceSchema.set('toJSON', { virtuals: true });
// chapterFinanceSchema.set('toObject', { virtuals: true });

// chapterFinanceSchema.plugin(mongoosePaginate);

// const ChapterFinance = mongoose.model("ChapterFinance", chapterFinanceSchema);

// export default ChapterFinance;

// models/ChapterFinance.js
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const collectionEntrySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ""
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  collectedAt: {
    type: Date,
    default: Date.now
  }
});

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Venue', 'Food', 'Printing', 'Admin', 'Misc', 'Other']
  },
  customCategory: {
    type: String,
    default: ""
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  receipt: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chapterFinanceSchema = new mongoose.Schema({
  chapter: {
    type: String,
    enum: ['Achiever', 'Believer', 'Creator', 'Dreamer', 'Elevator'],
    required: true,
    unique: true
  },
  totalCollections: {
    type: Number,
    default: 0,
    min: 0
  },
  collectionHistory: [collectionEntrySchema], // Track individual collections
  expenses: [expenseSchema],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chapterFinanceSchema.virtual('totalExpenses').get(function() {
  return this.expenses.reduce((total, expense) => total + expense.amount, 0);
});

chapterFinanceSchema.virtual('balance').get(function() {
  return this.totalCollections - this.totalExpenses;
});

chapterFinanceSchema.set('toJSON', { virtuals: true });
chapterFinanceSchema.set('toObject', { virtuals: true });

chapterFinanceSchema.plugin(mongoosePaginate);

const ChapterFinance = mongoose.model("ChapterFinance", chapterFinanceSchema);

export default ChapterFinance;