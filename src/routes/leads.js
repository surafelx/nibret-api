const express = require('express');
const Joi = require('joi');
const Lead = require('../models/Lead');
const { protect, authorize } = require('../middleware/auth');
const { logCustomActivity } = require('../middleware/activity');

const router = express.Router();

// Validation schemas
const leadSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  source: Joi.string().valid('website', 'phone_call', 'email', 'referral', 'social_media', 'advertisement', 'walk_in', 'other').default('website'),
  interested_property: Joi.string().optional(),
  property_preferences: Joi.object({
    budget_min: Joi.number().min(0),
    budget_max: Joi.number().min(0),
    property_type: Joi.array().items(Joi.string()),
    bedrooms: Joi.number().min(0),
    bathrooms: Joi.number().min(0),
    location_preferences: Joi.array().items(Joi.string()),
    special_requirements: Joi.string()
  }).optional(),
  notes: Joi.string().optional(),
  utm_source: Joi.string().optional(),
  utm_medium: Joi.string().optional(),
  utm_campaign: Joi.string().optional()
});

const interactionSchema = Joi.object({
  type: Joi.string().valid('call', 'email', 'meeting', 'property_viewing', 'follow_up', 'note').required(),
  description: Joi.string().required(),
  outcome: Joi.string().valid('positive', 'neutral', 'negative', 'no_response').optional(),
  next_action: Joi.string().optional(),
  next_action_date: Joi.date().optional()
});

// @route   GET /leads
// @desc    Get all leads with filtering
// @access  Private/Admin
router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const {
      status,
      priority,
      source,
      assigned_to,
      page = 1,
      limit = 20,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    if (assigned_to) query.assigned_to = assigned_to;

    // Search functionality
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort_order === 'desc' ? -1 : 1;

    const leads = await Lead.find(query)
      .populate('assigned_to', 'first_name last_name email')
      .populate('interested_property', 'title address price')
      .sort({ [sort_by]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
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

// @route   GET /leads/stats
// @desc    Get lead statistics
// @access  Private/Admin
router.get('/stats', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const stats = await Lead.getLeadStats();
    const conversionFunnel = await Lead.getConversionFunnel();
    const leadsBySource = await Lead.getLeadsBySource();
    const upcomingFollowUps = await Lead.getUpcomingFollowUps();
    const overdueFollowUps = await Lead.getOverdueFollowUps();

    res.json({
      success: true,
      data: {
        stats,
        conversion_funnel: conversionFunnel,
        leads_by_source: leadsBySource,
        upcoming_follow_ups: upcomingFollowUps,
        overdue_follow_ups: overdueFollowUps
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /leads/:id
// @desc    Get single lead with interaction history
// @access  Private/Admin
router.get('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assigned_to', 'first_name last_name email phone')
      .populate('interested_property', 'title address price images')
      .populate('interactions.created_by', 'first_name last_name');

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /leads
// @desc    Create new lead
// @access  Public (for website forms) / Private (for admin)
router.post('/', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = leadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Add metadata from request
    const leadData = {
      ...value,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      referrer_url: req.get('Referer')
    };

    // If user is authenticated, assign to them
    if (req.user) {
      leadData.assigned_to = req.user._id;
    }

    const lead = await Lead.create(leadData);
    await lead.populate('assigned_to', 'first_name last_name email');

    // Log activity
    if (req.user) {
      await logCustomActivity(
        req.user._id,
        'lead_created',
        'New lead created',
        `Created lead for ${lead.first_name} ${lead.last_name}`,
        { lead_id: lead._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /leads/:id
// @desc    Update lead
// @access  Private/Admin
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Validate input
    const updateSchema = leadSchema.fork(['first_name', 'last_name', 'email', 'phone'], (schema) => schema.optional());
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    Object.assign(lead, value);
    await lead.save();
    await lead.populate('assigned_to', 'first_name last_name email');

    // Log activity
    await logCustomActivity(
      req.user._id,
      'lead_updated',
      'Lead updated',
      `Updated lead for ${lead.first_name} ${lead.last_name}`,
      { lead_id: lead._id }
    );

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /leads/:id/status
// @desc    Update lead status
// @access  Private/Admin
router.patch('/:id/status', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await lead.updateStatus(status, notes);
    await lead.populate('assigned_to', 'first_name last_name email');

    // Log activity
    await logCustomActivity(
      req.user._id,
      'lead_status_updated',
      'Lead status updated',
      `Changed status to ${status} for ${lead.first_name} ${lead.last_name}`,
      { lead_id: lead._id, old_status: lead.status, new_status: status }
    );

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /leads/:id/interactions
// @desc    Add interaction to lead
// @access  Private/Admin
router.post('/:id/interactions', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Validate interaction data
    const { error, value } = interactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Add interaction
    const interactionData = {
      ...value,
      created_by: req.user._id
    };

    await lead.addInteraction(interactionData);
    await lead.populate('interactions.created_by', 'first_name last_name');

    // Log activity
    await logCustomActivity(
      req.user._id,
      value.type,
      `${value.type} interaction`,
      `${value.type} with ${lead.first_name} ${lead.last_name}: ${value.description}`,
      { lead_id: lead._id, interaction_type: value.type }
    );

    res.json({
      success: true,
      message: 'Interaction added successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /leads/:id/follow-up
// @desc    Schedule follow-up for lead
// @access  Private/Admin
router.post('/:id/follow-up', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { date, description } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await lead.scheduleFollowUp(new Date(date), description);

    // Log activity
    await logCustomActivity(
      req.user._id,
      'follow_up_scheduled',
      'Follow-up scheduled',
      `Scheduled follow-up for ${lead.first_name} ${lead.last_name} on ${new Date(date).toLocaleDateString()}`,
      { lead_id: lead._id, follow_up_date: date }
    );

    res.json({
      success: true,
      message: 'Follow-up scheduled successfully',
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /leads/:id
// @desc    Delete lead
// @access  Private/Admin
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    // Log activity
    await logCustomActivity(
      req.user._id,
      'lead_deleted',
      'Lead deleted',
      `Deleted lead for ${lead.first_name} ${lead.last_name}`,
      { lead_id: lead._id }
    );

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
