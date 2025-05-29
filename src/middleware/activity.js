const Activity = require('../models/Activity');

// Middleware to automatically track user activities
const trackActivity = (activityType, actionDescription) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Track activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        trackUserActivity(req, activityType, actionDescription, data);
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Function to track user activity
const trackUserActivity = async (req, type, action, responseData = null) => {
  try {
    const userId = req.user ? req.user._id : null;
    const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
    
    // Get metadata from request
    const metadata = {
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      page_url: req.get('Referer'),
      referrer: req.get('Referer'),
      method: req.method,
      endpoint: req.originalUrl,
      query_params: req.query,
      success: true
    };

    // Add specific metadata based on activity type
    switch (type) {
      case 'property_view':
      case 'property_click':
        if (req.params.id) {
          metadata.property_id = req.params.id;
        }
        break;
        
      case 'search':
        if (req.body.search || req.query.search) {
          metadata.search_query = req.body.search || req.query.search;
        }
        if (req.body.filters || req.query.filters) {
          metadata.filter_criteria = req.body.filters || req.query.filters;
        }
        break;
        
      case 'login':
        metadata.login_method = req.body.username ? 'username' : 'email';
        break;
        
      case 'property_upload':
      case 'property_edit':
        if (responseData && responseData.data && responseData.data._id) {
          metadata.property_id = responseData.data._id;
        }
        break;
        
      case 'contact_form':
      case 'property_inquiry':
        if (req.body.contact_info) {
          metadata.contact_info = {
            phone: req.body.contact_info.phone,
            email: req.body.contact_info.email,
            message: req.body.message
          };
        }
        break;
    }

    // Create activity record
    const activityData = {
      user: userId,
      type,
      action,
      description: generateDescription(type, action, req),
      metadata,
      session_id: sessionId,
      timestamp: new Date()
    };

    // Log activity asynchronously (don't block response)
    Activity.logActivity(activityData).catch(error => {
      console.error('Error logging activity:', error);
    });

  } catch (error) {
    console.error('Error in trackUserActivity:', error);
  }
};

// Generate human-readable description
const generateDescription = (type, action, req) => {
  const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'Anonymous user';
  
  switch (type) {
    case 'login':
      return `${userInfo} logged in`;
    case 'logout':
      return `${userInfo} logged out`;
    case 'property_view':
      return `${userInfo} viewed property details`;
    case 'property_click':
      return `${userInfo} clicked on property`;
    case 'search':
      const query = req.body.search || req.query.search || 'properties';
      return `${userInfo} searched for "${query}"`;
    case 'filter_applied':
      return `${userInfo} applied search filters`;
    case 'property_upload':
      return `${userInfo} uploaded a new property`;
    case 'property_edit':
      return `${userInfo} edited property details`;
    case 'property_delete':
      return `${userInfo} deleted a property`;
    case 'contact_form':
      return `${userInfo} submitted contact form`;
    case 'property_inquiry':
      return `${userInfo} inquired about property`;
    case 'profile_update':
      return `${userInfo} updated profile`;
    case 'page_view':
      return `${userInfo} visited ${req.originalUrl}`;
    default:
      return `${userInfo} performed ${action}`;
  }
};

// Middleware for specific activity types
const trackLogin = trackActivity('login', 'User login');
const trackLogout = trackActivity('logout', 'User logout');
const trackPropertyView = trackActivity('property_view', 'Property viewed');
const trackPropertyClick = trackActivity('property_click', 'Property clicked');
const trackSearch = trackActivity('search', 'Search performed');
const trackFilterApplied = trackActivity('filter_applied', 'Filters applied');
const trackPropertyUpload = trackActivity('property_upload', 'Property uploaded');
const trackPropertyEdit = trackActivity('property_edit', 'Property edited');
const trackPropertyDelete = trackActivity('property_delete', 'Property deleted');
const trackContactForm = trackActivity('contact_form', 'Contact form submitted');
const trackPropertyInquiry = trackActivity('property_inquiry', 'Property inquiry');
const trackProfileUpdate = trackActivity('profile_update', 'Profile updated');

// Page view tracking middleware
const trackPageView = (req, res, next) => {
  // Only track GET requests to avoid duplicates
  if (req.method === 'GET' && !req.originalUrl.includes('/api/')) {
    trackUserActivity(req, 'page_view', 'Page visited');
  }
  next();
};

// Error tracking middleware
const trackError = (error, req, res, next) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';
  
  const activityData = {
    user: userId,
    type: 'error',
    action: 'Error occurred',
    description: `Error: ${error.message}`,
    metadata: {
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      page_url: req.get('Referer'),
      method: req.method,
      endpoint: req.originalUrl,
      error_message: error.message,
      error_stack: error.stack,
      success: false
    },
    session_id: sessionId
  };

  // Log error activity
  Activity.logActivity(activityData).catch(logError => {
    console.error('Error logging error activity:', logError);
  });

  next(error);
};

// Manual activity logging function for custom events
const logCustomActivity = async (userId, type, action, description, metadata = {}) => {
  try {
    const activityData = {
      user: userId,
      type,
      action,
      description,
      metadata,
      timestamp: new Date()
    };

    return await Activity.logActivity(activityData);
  } catch (error) {
    console.error('Error logging custom activity:', error);
    throw error;
  }
};

module.exports = {
  trackActivity,
  trackUserActivity,
  trackLogin,
  trackLogout,
  trackPropertyView,
  trackPropertyClick,
  trackSearch,
  trackFilterApplied,
  trackPropertyUpload,
  trackPropertyEdit,
  trackPropertyDelete,
  trackContactForm,
  trackPropertyInquiry,
  trackProfileUpdate,
  trackPageView,
  trackError,
  logCustomActivity
};
