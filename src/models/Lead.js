const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  interested_property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  property_preferences: {
    budget_min: {
      type: Number,
      min: 0
    },
    budget_max: {
      type: Number,
      min: 0
    },
    property_type: [{
      type: String,
      enum: ['house', 'apartment', 'condo', 'villa', 'townhouse', 'studio', 'other']
    }],
    bedrooms: {
      type: Number,
      min: 0
    },
    bathrooms: {
      type: Number,
      min: 0
    },
    location_preferences: [String],
    special_requirements: String
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'lost', 'converted'],
    default: 'new'
  },
  source: {
    type: String,
    enum: ['website', 'phone_call', 'email', 'referral', 'social_media', 'advertisement', 'walk_in', 'other'],
    default: 'website'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  follow_up_date: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'property_viewing', 'follow_up', 'note'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    outcome: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'no_response']
    },
    next_action: String,
    next_action_date: Date,
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  // UTM tracking
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  // Request metadata
  ip_address: String,
  user_agent: String,
  referrer_url: String,
  converted_to_customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
leadSchema.index({ status: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assigned_to: 1 });
leadSchema.index({ created_at: -1 });
leadSchema.index({ follow_up_date: 1 });

// Method to add interaction
leadSchema.methods.addInteraction = function(interactionData) {
  this.interactions.push(interactionData);
  return this.save();
};

// Method to update status
leadSchema.methods.updateStatus = function(newStatus, notes) {
  const oldStatus = this.status;
  this.status = newStatus;

  if (notes) {
    this.notes = notes;
  }

  return this.save();
};

// Method to schedule follow-up
leadSchema.methods.scheduleFollowUp = function(date, description) {
  this.follow_up_date = date;
  this.interactions.push({
    type: 'follow_up',
    description: description || 'Follow-up scheduled',
    created_by: this.assigned_to,
    created_at: new Date()
  });
  return this.save();
};

// Static method to get leads by status
leadSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('interested_property', 'title address price')
    .populate('assigned_to', 'first_name last_name email')
    .sort({ created_at: -1 });
};

// Static method to get lead statistics
leadSchema.statics.getLeadStats = async function() {
  const totalLeads = await this.countDocuments();
  const newLeads = await this.countDocuments({ status: 'new' });
  const contactedLeads = await this.countDocuments({ status: 'contacted' });
  const qualifiedLeads = await this.countDocuments({ status: 'qualified' });
  const lostLeads = await this.countDocuments({ status: 'lost' });
  const convertedLeads = await this.countDocuments({ status: 'converted' });

  return {
    total: totalLeads,
    new: newLeads,
    contacted: contactedLeads,
    qualified: qualifiedLeads,
    lost: lostLeads,
    converted: convertedLeads,
    conversion_rate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0
  };
};

// Static method to get conversion funnel
leadSchema.statics.getConversionFunnel = async function() {
  const stats = await this.getLeadStats();
  return [
    { stage: 'New', count: stats.new },
    { stage: 'Contacted', count: stats.contacted },
    { stage: 'Qualified', count: stats.qualified },
    { stage: 'Converted', count: stats.converted }
  ];
};

// Static method to get leads by source
leadSchema.statics.getLeadsBySource = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get upcoming follow-ups
leadSchema.statics.getUpcomingFollowUps = async function() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  return await this.find({
    follow_up_date: {
      $gte: today,
      $lte: nextWeek
    }
  })
  .populate('assigned_to', 'first_name last_name email')
  .sort({ follow_up_date: 1 });
};

// Static method to get overdue follow-ups
leadSchema.statics.getOverdueFollowUps = async function() {
  const today = new Date();

  return await this.find({
    follow_up_date: {
      $lt: today
    },
    status: { $nin: ['converted', 'lost'] }
  })
  .populate('assigned_to', 'first_name last_name email')
  .sort({ follow_up_date: 1 });
};

module.exports = mongoose.model('Lead', leadSchema);
