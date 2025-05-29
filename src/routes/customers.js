const express = require('express');
const Joi = require('joi');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const customerSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
  preferences: Joi.object({
    property_types: Joi.array().items(Joi.string().valid('house', 'apartment', 'condo', 'villa', 'townhouse', 'studio', 'other')),
    min_price: Joi.number().min(0),
    max_price: Joi.number().min(0),
    min_beds: Joi.number().min(0),
    max_beds: Joi.number().min(0),
    preferred_locations: Joi.array().items(Joi.string())
  }),
  notes: Joi.string().max(1000),
  source: Joi.string().valid('website', 'referral', 'social_media', 'advertisement', 'walk_in', 'other'),
  status: Joi.string().valid('active', 'inactive', 'potential', 'converted')
});

const leadSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
  property: Joi.string().required(),
  property_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/), // MongoDB ObjectId
  message: Joi.string().max(1000),
  source: Joi.string().valid('website_form', 'phone_call', 'email', 'social_media', 'referral', 'other'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent')
});

// CUSTOMER ROUTES

// @route   GET /customers
// @desc    Get all customers
// @access  Private/Admin
router.get('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      search
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const customers = await Customer.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers: customers,
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

// @route   POST /customers
// @desc    Create new customer
// @access  Private/Admin
router.post('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { email: value.email },
        { phone: value.phone }
      ]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Customer with this email or phone already exists'
      });
    }

    const customer = await Customer.create(value);

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /customers/:id
// @desc    Get single customer
// @access  Private/Admin
router.get('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /customers/:id
// @desc    Update customer
// @access  Private/Admin
router.put('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /customers/:id
// @desc    Delete customer
// @access  Private/Admin
router.delete('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// LEAD ROUTES

// @route   GET /customers/leads
// @desc    Get all leads
// @access  Private/Admin
router.get('/leads', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assigned_to
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigned_to) query.assigned_to = assigned_to;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const leads = await Lead.find(query)
      .populate('property_id', 'title address price')
      .populate('assigned_to', 'first_name last_name email')
      .populate('notes.created_by', 'first_name last_name')
      .sort({ created_at: -1 })
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

// @route   POST /customers/leads
// @desc    Create new lead
// @access  Public
router.post('/leads', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = leadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const lead = await Lead.create(value);

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /customers/leads/:status
// @desc    Get leads by status
// @access  Private/Admin
router.get('/leads/:status', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.params;
    const leads = await Lead.getByStatus(status);

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /customers/leads/:id/status
// @desc    Update lead status
// @access  Private/Admin
router.patch('/leads/:id/status', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'contacted', 'qualified', 'lost', 'converted'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await lead.updateStatus(status, req.user._id);
    await lead.populate('property_id', 'title address price');
    await lead.populate('assigned_to', 'first_name last_name email');

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /customers/leads/:id/notes
// @desc    Add note to lead
// @access  Private/Admin
router.post('/leads/:id/notes', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    await lead.addNote(content.trim(), req.user._id);
    await lead.populate('notes.created_by', 'first_name last_name');

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /customers/leads/:id
// @desc    Delete lead
// @access  Private/Admin
router.delete('/leads/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
