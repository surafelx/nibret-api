const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous activities
  },
  type: {
    type: String,
    enum: [
      'login',
      'logout',
      'property_view',
      'property_click',
      'search',
      'filter_applied',
      'contact_form',
      'phone_call',
      'email_sent',
      'property_inquiry',
      'property_favorite',
      'profile_update',
      'password_change',
      'property_upload',
      'property_edit',
      'property_delete',
      'image_upload',
      'admin_action',
      'page_view',
      'button_click',
      'form_submission',
      'error',
      'lead_created',
      'lead_updated',
      'lead_status_updated',
      'follow_up_scheduled',
      'lead_deleted'
    ],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  metadata: {
    property_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    page_url: String,
    user_agent: String,
    ip_address: String,
    referrer: String,
    search_query: String,
    filter_criteria: mongoose.Schema.Types.Mixed,
    contact_info: {
      phone: String,
      email: String,
      message: String
    },
    duration: Number, // in seconds
    success: Boolean,
    error_message: String,
    additional_data: mongoose.Schema.Types.Mixed
  },
  session_id: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ 'metadata.property_id': 1 });
activitySchema.index({ session_id: 1 });
activitySchema.index({ timestamp: -1 });

// Static methods for analytics
activitySchema.statics.getUserActivity = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    user: userId,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: -1 });
};

activitySchema.statics.getPopularProperties = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        type: { $in: ['property_view', 'property_click'] },
        'metadata.property_id': { $exists: true },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.property_id',
        views: { $sum: 1 },
        unique_users: { $addToSet: '$user' }
      }
    },
    {
      $addFields: {
        unique_user_count: { $size: '$unique_users' }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: 20
    }
  ]);
};

activitySchema.statics.getSearchAnalytics = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        type: 'search',
        'metadata.search_query': { $exists: true },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.search_query',
        count: { $sum: 1 },
        users: { $addToSet: '$user' }
      }
    },
    {
      $addFields: {
        unique_users: { $size: '$users' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 50
    }
  ]);
};

activitySchema.statics.getDailyStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        total_activities: { $sum: 1 },
        unique_users: { $addToSet: '$user' },
        activity_types: { $addToSet: '$type' }
      }
    },
    {
      $addFields: {
        unique_user_count: { $size: '$unique_users' },
        activity_type_count: { $size: '$activity_types' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
    }
  ]);
};

activitySchema.statics.getUserEngagement = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$user',
        total_activities: { $sum: 1 },
        activity_types: { $addToSet: '$type' },
        first_activity: { $min: '$timestamp' },
        last_activity: { $max: '$timestamp' },
        sessions: { $addToSet: '$session_id' }
      }
    },
    {
      $addFields: {
        activity_diversity: { $size: '$activity_types' },
        session_count: { $size: '$sessions' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user_info'
      }
    },
    {
      $unwind: '$user_info'
    },
    {
      $sort: { total_activities: -1 }
    }
  ]);
};

// Method to log activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

module.exports = mongoose.model('Activity', activitySchema);
