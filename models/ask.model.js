import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const askSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  businessCategory: { 
    type: String, 
    required: true 
  },
  businessSubCategory: { 
    type: String, 
    required: true 
  },
  product: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  timeDuration: { 
    type: String, 
    enum: ['inquiry','urgent', 'one month', 'two months', 'three months'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending',  'completed'],
    default: 'pending'
  },
  leads: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    price: { 
      type: Number, 
      default: 0 
    },
    details: { 
      type: String 
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  businessGiven: [{
    partnerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    givenAt: { 
      type: Date, 
      default: Date.now 
    },
    details: { 
      type: String 
    }
  }],
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

askSchema.plugin(mongoosePaginate);
askSchema.plugin(mongooseAggregatePaginate);

const Ask = mongoose.model('Ask', askSchema);

export default Ask;