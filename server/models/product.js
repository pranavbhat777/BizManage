const db = require('../config/database');

class Product {
  static async createProduct(businessId, productData) {
    try {
      const product = {
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        business_id: businessId,
        name: productData.name,
        description: productData.description || null,
        sku: productData.sku || null,
        category: productData.category || null,
        opening_quantity: parseFloat(productData.opening_quantity) || 0,
        current_quantity: parseFloat(productData.opening_quantity) || 0,
        purchasing_price: parseFloat(productData.purchasing_price) || 0,
        selling_price: parseFloat(productData.selling_price) || 0,
        unit: productData.unit || 'pieces',
        min_stock_level: parseFloat(productData.min_stock_level) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const [result] = await db('products').insert(product).returning('*');
      return result;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async getProductsByBusinessId(businessId, page = 1, limit = 50, search = '') {
    try {
      let query = db('products').where({ business_id: businessId });
      
      if (search) {
        query = query.where(function() {
          this.where('name', 'like', `%${search}%`)
            .orWhere('sku', 'like', `%${search}%`)
            .orWhere('category', 'like', `%${search}%`);
        });
      }

      const offset = (page - 1) * limit;
      const products = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const totalCount = await db('products')
        .where({ business_id: businessId })
        .count('* as count')
        .first();

      return {
        products,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  static async getProductById(productId, businessId) {
    try {
      const product = await db('products')
        .where({ id: productId, business_id: businessId })
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  }

  static async updateProduct(productId, businessId, updateData) {
    try {
      const product = await this.getProductById(productId, businessId);

      const updatedData = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Handle current_quantity update directly
      if (updateData.current_quantity !== undefined) {
        updatedData.current_quantity = parseFloat(updateData.current_quantity);
      }

      const [result] = await db('products')
        .where({ id: productId, business_id: businessId })
        .update(updatedData)
        .returning('*');

      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(productId, businessId) {
    try {
      // Check if product exists
      await this.getProductById(productId, businessId);

      // Delete related transactions first
      await db('product_transactions').where({ product_id: productId }).del();

      // Delete the product
      await db('products').where({ id: productId, business_id: businessId }).del();

      return { message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async recordTransaction(productId, businessId, transactionData) {
    try {
      const transaction = {
        id: 'trans-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        product_id: productId,
        business_id: businessId,
        transaction_type: transactionData.transaction_type, // 'purchase', 'sale', 'adjustment'
        quantity: parseFloat(transactionData.quantity),
        unit_price: parseFloat(transactionData.unit_price),
        total_amount: parseFloat(transactionData.quantity) * parseFloat(transactionData.unit_price),
        reference: transactionData.reference || null,
        notes: transactionData.notes || null,
        transaction_date: transactionData.transaction_date || new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const [result] = await db('product_transactions').insert(transaction).returning('*');

      // Update product current quantity
      const product = await this.getProductById(productId, businessId);
      let newQuantity = product.current_quantity;
      
      console.log('🔄 Transaction Debug:');
      console.log('- Product ID:', productId);
      console.log('- Current Quantity:', product.current_quantity);
      console.log('- Transaction Type:', transactionData.transaction_type);
      console.log('- Transaction Quantity:', transactionData.quantity);
      console.log('- Old Quantity:', newQuantity);

      if (transactionData.transaction_type === 'purchase' || transactionData.transaction_type === 'production') {
        newQuantity += parseFloat(transactionData.quantity);
        console.log('- New Quantity (after +):', newQuantity);
      } else if (transactionData.transaction_type === 'sale') {
        newQuantity -= parseFloat(transactionData.quantity);
        console.log('- New Quantity (after -):', newQuantity);
      } else if (transactionData.transaction_type === 'adjustment') {
        newQuantity = parseFloat(transactionData.quantity); // Set to exact quantity
        console.log('- New Quantity (adjustment):', newQuantity);
      }

      await db('products')
        .where({ id: productId, business_id: businessId })
        .update({ 
          current_quantity: newQuantity,
          updated_at: new Date().toISOString()
        });

      return result;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  static async getProductTransactions(productId, businessId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const transactions = await db('product_transactions')
        .where({ product_id: productId, business_id: businessId })
        .orderBy('transaction_date', 'desc')
        .limit(limit)
        .offset(offset);

      const totalCount = await db('product_transactions')
        .where({ product_id: productId, business_id: businessId })
        .count('* as count')
        .first();

      return {
        transactions,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          totalPages: Math.ceil(totalCount.count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting product transactions:', error);
      throw error;
    }
  }

  static async getDailyProfitability(businessId, startDate, endDate) {
    try {
      const dailyData = await db('product_transactions')
        .join('products', 'product_transactions.product_id', 'products.id')
        .where({
          'product_transactions.business_id': businessId,
          'products.business_id': businessId
        })
        .where('product_transactions.transaction_date', '>=', startDate)
        .where('product_transactions.transaction_date', '<=', endDate)
        .select(
          db.raw('DATE(product_transactions.transaction_date) as date'),
          'product_transactions.transaction_type',
          db.raw('SUM(product_transactions.total_amount) as total_amount'),
          db.raw('SUM(product_transactions.quantity) as total_quantity'),
          db.raw('COUNT(*) as transaction_count')
        )
        .groupBy(db.raw('DATE(product_transactions.transaction_date)'))
        .groupBy('product_transactions.transaction_type')
        .orderBy(db.raw('DATE(product_transactions.transaction_date)'), 'desc');

      // Process the data to calculate profitability
      const profitabilityByDate = {};
      
      dailyData.forEach(row => {
        const date = row.date;
        if (!profitabilityByDate[date]) {
          profitabilityByDate[date] = {
            date,
            total_sales: 0,
            total_purchases: 0,
            total_sales_amount: 0,
            total_purchases_amount: 0,
            gross_profit: 0,
            profit_margin: 0,
            transactions: []
          };
        }

        if (row.transaction_type === 'sale') {
          profitabilityByDate[date].total_sales += row.total_quantity || 0;
          profitabilityByDate[date].total_sales_amount += row.total_amount || 0;
        } else if (row.transaction_type === 'purchase' || row.transaction_type === 'production') {
          profitabilityByDate[date].total_purchases += row.total_quantity || 0;
          profitabilityByDate[date].total_purchases_amount += row.total_amount || 0;
        }

        profitabilityByDate[date].transactions.push({
          type: row.transaction_type,
          amount: row.total_amount || 0,
          quantity: row.total_quantity || 0,
          count: row.transaction_count || 0
        });
      });

      // Calculate profit for each day
      Object.keys(profitabilityByDate).forEach(date => {
        const day = profitabilityByDate[date];
        day.gross_profit = day.total_sales_amount - day.total_purchases_amount;
        day.profit_margin = day.total_sales_amount > 0 ? 
          (day.gross_profit / day.total_sales_amount) * 100 : 0;
      });

      return Object.values(profitabilityByDate);
    } catch (error) {
      console.error('Error getting daily profitability:', error);
      throw error;
    }
  }

  static async getLowStockProducts(businessId) {
    try {
      const products = await db('products')
        .where({ business_id: businessId })
        .whereRaw('current_quantity <= min_stock_level')
        .orderBy('current_quantity', 'asc');

      return products;
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }

  static async getProductStats(businessId) {
    try {
      const stats = await db('products')
        .where({ business_id: businessId })
        .select(
          db.raw('COUNT(*) as total_products'),
          db.raw('SUM(current_quantity) as total_quantity'),
          db.raw('SUM(current_quantity * selling_price) as total_value'),
          db.raw('COUNT(CASE WHEN current_quantity <= min_stock_level THEN 1 END) as low_stock_count')
        )
        .first();

      return stats;
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw error;
    }
  }
}

module.exports = Product;
