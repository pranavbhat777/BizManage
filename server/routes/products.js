const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const db = require('../config/database');

// Mock business ID since we removed auth
const mockBusinessId = 1;

// Get all products for a business
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const result = await Product.getProductsByBusinessId(mockBusinessId, parseInt(page), parseInt(limit), search);
    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get product statistics
router.get('/stats', async (req, res) => {
  try {
    // Get basic product stats
    const productStats = await db('products')
      .where({ business_id: mockBusinessId })
      .select(
        db.raw('COUNT(*) as total_products'),
        db.raw('SUM(current_quantity) as total_quantity'),
        db.raw('SUM(current_quantity * selling_price) as total_value'),
        db.raw('COUNT(CASE WHEN current_quantity <= min_stock_level THEN 1 END) as low_stock_count')
      )
      .first();

    // Initialize transaction stats with zeros
    let transactionStats = {
      total_sales_value: 0,
      total_production_value: 0,
      total_purchase_value: 0
    };

    // Try to get transaction stats (handle case where table doesn't exist)
    try {
      const tempStats = await db('product_transactions')
        .join('products', 'product_transactions.product_id', 'products.id')
        .where({
          'product_transactions.business_id': mockBusinessId,
          'products.business_id': mockBusinessId
        })
        .select(
          db.raw('SUM(CASE WHEN transaction_type = \'sale\' THEN total_amount ELSE 0 END) as total_sales_value'),
          db.raw('SUM(CASE WHEN transaction_type = \'production\' THEN total_amount ELSE 0 END) as total_production_value'),
          db.raw('SUM(CASE WHEN transaction_type = \'purchase\' THEN total_amount ELSE 0 END) as total_purchase_value')
        )
        .first();
      
      if (tempStats) {
        transactionStats = tempStats;
      }
    } catch (error) {
      console.log('Transaction stats query failed, using zeros:', error.message);
      // Keep transactionStats as zeros if table doesn't exist or query fails
    }

    const stats = {
      total_products: productStats.total_products || 0,
      total_quantity: productStats.total_quantity || 0,
      total_value: productStats.total_value || 0,
      low_stock_count: productStats.low_stock_count || 0,
      total_sales_value: transactionStats.total_sales_value || 0,
      total_production_value: transactionStats.total_production_value || 0,
      total_purchase_value: transactionStats.total_purchase_value || 0
    };

    console.log('Product stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching product stats' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.getProductById(req.params.id, mockBusinessId);
    res.json(product);
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      category,
      opening_quantity,
      purchasing_price,
      selling_price,
      unit,
      min_stock_level
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Check if product name already exists for this business
    const existingProduct = await db('products')
      .where({ 
        business_id: mockBusinessId,
        name: name.trim()
      })
      .first();

    if (existingProduct) {
      return res.status(400).json({ message: 'Product name already exists. Please use a different name.' });
    }

    // Remove validation for optional fields
    // opening_quantity, purchasing_price, and selling_price are now optional

    const productData = {
      name,
      description,
      sku,
      category,
      unit,
      min_stock_level
    };

    const product = await Product.createProduct(mockBusinessId, productData);
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      category,
      opening_quantity,
      purchasing_price,
      selling_price,
      unit,
      min_stock_level
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const updateData = {
      name,
      description,
      sku,
      category,
      current_quantity: current_quantity ? parseFloat(current_quantity) : undefined,
      unit: unit || 'pieces',
      min_stock_level: min_stock_level ? parseFloat(min_stock_level) : undefined
    };

    const product = await Product.updateProduct(req.params.id, mockBusinessId, updateData);
    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const result = await Product.deleteProduct(req.params.id, mockBusinessId);
    res.json(result);
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: 'Product not found' });
    }
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// Record product transaction (purchase/sale/adjustment)
router.post('/:id/transactions', async (req, res) => {
  try {
    const {
      transaction_type,
      quantity,
      unit_price,
      reference,
      notes,
      transaction_date
    } = req.body;

    if (!transaction_type || !['purchase', 'sale', 'adjustment', 'production'].includes(transaction_type)) {
      return res.status(400).json({ 
        message: 'Transaction type is required and must be one of: purchase, sale, adjustment, production' 
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity is required and must be positive' });
    }

    if (!unit_price || unit_price < 0) {
      return res.status(400).json({ message: 'Unit price is required and must be non-negative' });
    }

    const transactionData = {
      transaction_type,
      quantity: parseFloat(quantity),
      unit_price: parseFloat(unit_price),
      reference,
      notes,
      transaction_date: transaction_date || new Date().toISOString()
    };

    const transaction = await Product.recordTransaction(req.params.id, mockBusinessId, transactionData);
    res.status(201).json({
      message: 'Transaction recorded successfully',
      transaction
    });
  } catch (error) {
    console.error('Record transaction error:', error);
    res.status(500).json({ message: 'Server error recording transaction' });
  }
});

// Get all transactions for a business
router.get('/transactions/all', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    const transactions = await db('product_transactions')
      .join('products', 'product_transactions.product_id', 'products.id')
      .where({
        'product_transactions.business_id': mockBusinessId,
        'products.business_id': mockBusinessId
      })
      .select(
        'product_transactions.*',
        'products.name as product_name'
      )
      .orderBy('product_transactions.transaction_date', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));

    const totalCount = await db('product_transactions')
      .join('products', 'product_transactions.product_id', 'products.id')
      .where({
        'product_transactions.business_id': mockBusinessId,
        'products.business_id': mockBusinessId
      })
      .count('* as count')
      .first();

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// Get product transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await Product.getProductTransactions(req.params.id, mockBusinessId, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// Get daily profitability
router.get('/profitability/daily', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        message: 'Start date and end date are required' 
      });
    }

    const profitability = await Product.getDailyProfitability(
      mockBusinessId, 
      start_date, 
      end_date
    );
    
    res.json(profitability);
  } catch (error) {
    console.error('Get profitability error:', error);
    res.status(500).json({ message: 'Server error fetching profitability' });
  }
});

// Get low stock products
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const products = await Product.getLowStockProducts(mockBusinessId);
    res.json(products);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error fetching low stock products' });
  }
});

// Get product statistics
router.get('/stats', async (req, res) => {
  try {
    // Get basic product stats
    const productStats = await db('products')
      .where({ business_id: mockBusinessId })
      .select(
        db.raw('COUNT(*) as total_products'),
        db.raw('SUM(current_quantity) as total_quantity'),
        db.raw('SUM(current_quantity * selling_price) as total_value'),
        db.raw('COUNT(CASE WHEN current_quantity <= min_stock_level THEN 1 END) as low_stock_count')
      )
      .first();

    // Initialize transaction stats with zeros
    let transactionStats = {
      total_sales_value: 0,
      total_production_value: 0,
      total_purchase_value: 0
    };

    // Try to get transaction stats (handle case where table doesn't exist)
    try {
      const tempStats = await db('product_transactions')
        .join('products', 'product_transactions.product_id', 'products.id')
        .where({
          'product_transactions.business_id': mockBusinessId,
          'products.business_id': mockBusinessId
        })
        .select(
          db.raw('SUM(CASE WHEN transaction_type = \'sale\' THEN total_amount ELSE 0 END) as total_sales_value'),
          db.raw('SUM(CASE WHEN transaction_type = \'production\' THEN total_amount ELSE 0 END) as total_production_value'),
          db.raw('SUM(CASE WHEN transaction_type = \'purchase\' THEN total_amount ELSE 0 END) as total_purchase_value')
        )
        .first();
      
      if (tempStats) {
        transactionStats = tempStats;
      }
    } catch (error) {
      console.log('Transaction stats query failed, using zeros:', error.message);
      // Keep transactionStats as zeros if table doesn't exist or query fails
    }

    const stats = {
      total_products: productStats.total_products || 0,
      total_quantity: productStats.total_quantity || 0,
      total_value: productStats.total_value || 0,
      low_stock_count: productStats.low_stock_count || 0,
      total_sales_value: transactionStats.total_sales_value || 0,
      total_production_value: transactionStats.total_production_value || 0,
      total_purchase_value: transactionStats.total_purchase_value || 0
    };

    console.log('Product stats calculated:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching product stats' });
  }
});

module.exports = router;
