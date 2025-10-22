const express = require('express');
const { body, query: queryValidator, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user transactions with filtering and pagination
// @access  Private
router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  queryValidator('type').optional().isIn(['income', 'expense', 'transfer']),
  queryValidator('category_id').optional().isInt({ min: 1 }),
  queryValidator('start_date').optional().isISO8601().withMessage('Invalid start date format'),
  queryValidator('end_date').optional().isISO8601().withMessage('Invalid end date format'),
  queryValidator('sort').optional().isIn(['date', 'amount', 'created_at']),
  queryValidator('order').optional().isIn(['asc', 'desc'])
], authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      category_id,
      user_category_id,
      start_date,
      end_date,
      sort = 'date',
      order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = ['t.user_id = ?'];
    const queryParams = [req.user.id];

    if (type) {
      whereConditions.push('t.transaction_type = ?');
      queryParams.push(type);
    }

    if (category_id) {
      whereConditions.push('t.category_id = ?');
      queryParams.push(category_id);
    }

    if (user_category_id) {
      whereConditions.push('t.user_category_id = ?');
      queryParams.push(user_category_id);
    }

    if (start_date) {
      whereConditions.push('t.transaction_date >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('t.transaction_date <= ?');
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get transactions with category information
    const transactions = await query(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        uc.name as user_category_name,
        uc.icon as user_category_icon,
        uc.color as user_category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN user_categories uc ON t.user_category_id = uc.id
      WHERE ${whereClause}
      ORDER BY t.${sort} ${order.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Get total count for pagination
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE ${whereClause}
    `, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    const transactions = await query(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        uc.name as user_category_name,
        uc.icon as user_category_icon,
        uc.color as user_category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN user_categories uc ON t.user_category_id = uc.id
      WHERE t.id = ? AND t.user_id = ?
    `, [id, req.user.id]);

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: {
        transaction: transactions[0]
      }
    });

  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
  body('category_id').optional().isInt({ min: 1 }),
  body('user_category_id').optional().isInt({ min: 1 }),
  body('transaction_type').isIn(['income', 'expense', 'transfer']),
  body('transaction_date').isISO8601().withMessage('Invalid date format'),
  body('mood_before').optional().isIn(['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']),
  body('mood_after').optional().isIn(['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']),
  body('location').optional().trim().isLength({ max: 255 }),
  body('tags').optional().isArray(),
  body('is_recurring').optional().isBoolean(),
  body('recurring_pattern').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      amount,
      description,
      category_id,
      user_category_id,
      transaction_type,
      transaction_date,
      mood_before,
      mood_after,
      location,
      tags,
      is_recurring = false,
      recurring_pattern
    } = req.body;

    // Validate that either category_id or user_category_id is provided, but not both
    if (!category_id && !user_category_id) {
      return res.status(400).json({
        success: false,
        message: 'Either category_id or user_category_id must be provided'
      });
    }

    if (category_id && user_category_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot provide both category_id and user_category_id'
      });
    }

    // If category_id is provided, verify it exists
    if (category_id) {
      const category = await query('SELECT id FROM categories WHERE id = ?', [category_id]);
      if (category.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category_id'
        });
      }
    }

    // If user_category_id is provided, verify it belongs to the user
    if (user_category_id) {
      const userCategory = await query(
        'SELECT id FROM user_categories WHERE id = ? AND user_id = ?',
        [user_category_id, req.user.id]
      );
      if (userCategory.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user_category_id'
        });
      }
    }

    const result = await transaction(async (conn) => {
      // Insert transaction
      const [transactionResult] = await conn.execute(`
        INSERT INTO transactions (
          user_id, amount, description, category_id, user_category_id,
          transaction_type, transaction_date, mood_before, mood_after,
          location, tags, is_recurring, recurring_pattern, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        req.user.id, amount, description, category_id, user_category_id,
        transaction_type, transaction_date, mood_before, mood_after,
        location, tags ? JSON.stringify(tags) : null, is_recurring, recurring_pattern
      ]);

      const transactionId = transactionResult.insertId;

      // Award first transaction achievement if this is the user's first transaction
      const existingTransactions = await conn.execute(
        'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
        [req.user.id]
      );

      if (existingTransactions[0][0].count === 1) {
        await conn.execute(
          'INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, icon, points) VALUES (?, ?, ?, ?, ?, ?)',
          [req.user.id, 'transaction', 'First Transaction', 'Added your first transaction', '💳', 5]
        );
      }

      return transactionId;
    });

    // Get the created transaction with category information
    const newTransaction = await query(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        uc.name as user_category_name,
        uc.icon as user_category_icon,
        uc.color as user_category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN user_categories uc ON t.user_category_id = uc.id
      WHERE t.id = ?
    `, [result]);

    logger.info(`Transaction created: ${result} for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction: newTransaction[0]
      }
    });

  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
  body('category_id').optional().isInt({ min: 1 }),
  body('user_category_id').optional().isInt({ min: 1 }),
  body('transaction_type').optional().isIn(['income', 'expense', 'transfer']),
  body('transaction_date').optional().isISO8601().withMessage('Invalid date format'),
  body('mood_before').optional().isIn(['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']),
  body('mood_after').optional().isIn(['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']),
  body('location').optional().trim().isLength({ max: 255 }),
  body('tags').optional().isArray(),
  body('is_recurring').optional().isBoolean(),
  body('recurring_pattern').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if transaction exists and belongs to user
    const existingTransaction = await query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingTransaction.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'tags') {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(updateData[key]));
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await query(
      `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated transaction
    const updatedTransaction = await query(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        uc.name as user_category_name,
        uc.icon as user_category_icon,
        uc.color as user_category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN user_categories uc ON t.user_category_id = uc.id
      WHERE t.id = ?
    `, [id]);

    logger.info(`Transaction updated: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        transaction: updatedTransaction[0]
      }
    });

  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const existingTransaction = await query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingTransaction.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await query('DELETE FROM transactions WHERE id = ?', [id]);

    logger.info(`Transaction deleted: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    logger.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/transactions/categories
// @desc    Get available categories
// @access  Private
router.get('/categories', authenticateJWT, async (req, res) => {
  try {
    const [defaultCategories, userCategories] = await Promise.all([
      query('SELECT * FROM categories WHERE is_default = TRUE ORDER BY name'),
      query('SELECT * FROM user_categories WHERE user_id = ? ORDER BY name', [req.user.id])
    ]);

    res.json({
      success: true,
      data: {
        default_categories: defaultCategories,
        user_categories: userCategories
      }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/transactions/categories
// @desc    Create user category
// @access  Private
router.post('/categories', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, icon, color = '#6366F1' } = req.body;

    // Check if category name already exists for this user
    const existingCategory = await query(
      'SELECT id FROM user_categories WHERE user_id = ? AND name = ?',
      [req.user.id, name]
    );

    if (existingCategory.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const result = await query(
      'INSERT INTO user_categories (user_id, name, icon, color, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.user.id, name, icon, color]
    );

    const newCategory = await query(
      'SELECT * FROM user_categories WHERE id = ?',
      [result.insertId]
    );

    logger.info(`User category created: ${result.insertId} for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: newCategory[0]
      }
    });

  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
