const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  response: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  usage: {
    count: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: null
    }
  },
  metadata: {
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    priority: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for faster lookups
datasetSchema.index({ category: 1, key: 1 }, { unique: true });
datasetSchema.index({ key: 'text', response: 'text' }); // Text search index

// Pre-save middleware to update timestamps
datasetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
datasetSchema.statics.findByCategory = function(category) {
  return this.find({ category: category.toLowerCase(), isActive: true });
};

datasetSchema.statics.searchByKey = function(searchTerm) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { key: { $regex: searchTerm.toLowerCase(), $options: 'i' } },
          { response: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  });
};

datasetSchema.statics.getStats = async function() {
  const pipeline = [
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalUsage: { $sum: '$usage.count' },
        avgConfidence: { $avg: '$metadata.confidence' }
      }
    },
    {
      $group: {
        _id: null,
        totalResponses: { $sum: '$count' },
        totalCategories: { $sum: 1 },
        totalUsage: { $sum: '$totalUsage' },
        categoryStats: {
          $push: {
            category: '$_id',
            count: '$count',
            usage: '$totalUsage',
            avgConfidence: '$avgConfidence'
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalResponses: 0,
    totalCategories: 0,
    totalUsage: 0,
    categoryStats: []
  };
};

// Instance methods
datasetSchema.methods.incrementUsage = function() {
  this.usage.count += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('Dataset', datasetSchema);