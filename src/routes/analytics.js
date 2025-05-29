const express = require('express');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const Property = require('../models/Property');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /analytics/track
// @desc    Track user activity
// @access  Public/Private
router.post('/track', async (req, res, next) => {
  try {
    const {
      type,
      action,
      description,
      metadata = {},
      session_id
    } = req.body;

    // Get user ID if authenticated
    const userId = req.user ? req.user._id : null;

    // Get IP and user agent from request
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    const activityData = {
      user: userId,
      type,
      action,
      description,
      metadata: {
        ...metadata,
        ip_address,
        user_agent,
        page_url: req.get('Referer')
      },
      session_id
    };

    const activity = await Activity.logActivity(activityData);

    res.status(201).json({
      success: true,
      message: 'Activity tracked successfully',
      data: activity
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /analytics/dashboard
// @desc    Get admin dashboard analytics
// @access  Private/Admin
router.get('/dashboard', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days);

    // Get date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Parallel queries for dashboard data
    const [
      totalUsers,
      totalProperties,
      totalLeads,
      recentActivities,
      popularProperties,
      searchAnalytics,
      dailyStats,
      userEngagement,
      leadStats,
      conversionFunnel
    ] = await Promise.all([
      User.countDocuments({ is_active: true }),
      Property.countDocuments(),
      Lead.countDocuments(),
      Activity.find({ timestamp: { $gte: startDate } })
        .populate('user', 'first_name last_name email')
        .sort({ timestamp: -1 })
        .limit(50),
      Activity.getPopularProperties(daysNum),
      Activity.getSearchAnalytics(daysNum),
      Activity.getDailyStats(daysNum),
      Activity.getUserEngagement(daysNum),
      Lead.getByStatus('new'),
      Lead.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysNum);

    const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
      User.countDocuments({ created_at: { $gte: startDate } }),
      User.countDocuments({ 
        created_at: { 
          $gte: previousPeriodStart, 
          $lt: startDate 
        } 
      })
    ]);

    const userGrowth = previousPeriodUsers > 0 
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          total_users: totalUsers,
          total_properties: totalProperties,
          total_leads: totalLeads,
          user_growth: Math.round(userGrowth * 100) / 100
        },
        recent_activities: recentActivities,
        popular_properties: popularProperties,
        search_analytics: searchAnalytics,
        daily_stats: dailyStats,
        user_engagement: userEngagement.slice(0, 20), // Top 20 most engaged users
        lead_stats: leadStats,
        conversion_funnel: conversionFunnel,
        period: {
          days: daysNum,
          start_date: startDate,
          end_date: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /analytics/users/:userId
// @desc    Get specific user analytics
// @access  Private/Admin
router.get('/users/:userId', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userActivities = await Activity.getUserActivity(userId, parseInt(days));
    
    // Get user's property interactions
    const propertyInteractions = await Activity.find({
      user: userId,
      type: { $in: ['property_view', 'property_click', 'property_inquiry'] }
    }).populate('metadata.property_id', 'title address price');

    // Get user's search history
    const searchHistory = await Activity.find({
      user: userId,
      type: 'search'
    }).sort({ timestamp: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        activities: userActivities,
        property_interactions: propertyInteractions,
        search_history: searchHistory,
        summary: {
          total_activities: userActivities.length,
          property_views: propertyInteractions.filter(a => a.type === 'property_view').length,
          searches: searchHistory.length,
          last_activity: userActivities[0]?.timestamp
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /analytics/properties/popular
// @desc    Get popular properties analytics
// @access  Private/Admin
router.get('/properties/popular', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const popularProperties = await Activity.getPopularProperties(parseInt(days));
    
    // Populate property details
    const propertyIds = popularProperties.map(p => p._id);
    const properties = await Property.find({ _id: { $in: propertyIds } })
      .populate('owner', 'first_name last_name email');

    // Merge analytics with property data
    const result = popularProperties.map(analytics => {
      const property = properties.find(p => p._id.toString() === analytics._id.toString());
      return {
        property,
        analytics: {
          views: analytics.views,
          unique_users: analytics.unique_user_count
        }
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /analytics/leads/funnel
// @desc    Get lead conversion funnel
// @access  Private/Admin
router.get('/leads/funnel', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const funnelData = await Lead.aggregate([
      {
        $match: {
          created_at: { 
            $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) 
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          sources: { $addToSet: '$source' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Calculate conversion rates
    const totalLeads = funnelData.reduce((sum, stage) => sum + stage.count, 0);
    const funnelWithRates = funnelData.map(stage => ({
      ...stage,
      conversion_rate: totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0
    }));

    res.json({
      success: true,
      data: {
        funnel: funnelWithRates,
        total_leads: totalLeads,
        period_days: parseInt(days)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /analytics/activities/recent
// @desc    Get recent activities with filters
// @access  Private/Admin
router.get('/activities/recent', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const {
      type,
      user_id,
      limit = 50,
      page = 1
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (user_id) query.user = user_id;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const activities = await Activity.find(query)
      .populate('user', 'first_name last_name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /analytics/activities/cleanup
// @desc    Clean up old activities (older than specified days)
// @access  Private/Super Admin
router.delete('/activities/cleanup', protect, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { days = 90 } = req.body;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await Activity.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old activities`,
      deleted_count: result.deletedCount,
      cutoff_date: cutoffDate
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
