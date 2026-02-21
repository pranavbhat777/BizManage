import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { formatIndianCurrency } from '../utils/currencyFormat';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    opening_quantity: '',
    purchasing_price: '',
    selling_price: '',
    unit: 'pieces',
    min_stock_level: ''
  });

  const [transactionData, setTransactionData] = useState({
    transaction_type: 'purchase',
    quantity: '',
    unit_price: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchAllTransactions(); // Fetch transactions on initial load
  }, [currentPage, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tabValue === 1 || tabValue === 2) {
      fetchAllTransactions();
    }
  }, [tabValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/products?page=${currentPage}&limit=50&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      console.log('🔄 Fetching all transactions...');
      // Fetch transactions for all products
      const response = await fetch('http://localhost:5000/api/products/transactions/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('📊 Transactions response:', data);
      setTransactions(data.transactions || []);
      console.log('✅ Transactions set:', data.transactions?.length || 0, 'items');
    } catch (error) {
      console.error('❌ Error fetching all transactions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setOpenDialog(false);
        resetForm();
        fetchProducts();
        fetchStats();
      } else {
        setMessage(data.message || 'Error saving product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage('Error saving product');
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('📝 Submitting transaction:', transactionData);
      const response = await fetch(`http://localhost:5000/api/products/${selectedProduct.id}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transactionData)
      });

      const data = await response.json();
      console.log('📊 Transaction response:', data);
      
      if (response.ok) {
        setMessage('Transaction recorded successfully');
        setOpenTransactionDialog(false);
        resetTransactionForm();
        console.log('🔄 Refreshing data after transaction...');
        fetchProducts(); // Refresh products to update quantities
        fetchStats(); // Refresh stats
        fetchAllTransactions(); // Refresh transactions list
      } else {
        setMessage(data.message || 'Error recording transaction');
      }
    } catch (error) {
      console.error('❌ Error recording transaction:', error);
      setMessage('Error recording transaction');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      category: product.category || '',
      current_quantity: product.current_quantity.toString(),
      unit: product.unit || 'pieces',
      min_stock_level: product.min_stock_level.toString()
    });
    setOpenDialog(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Product deleted successfully');
        fetchProducts();
        fetchStats();
      } else {
        setMessage(data.message || 'Error deleting product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage('Error deleting product');
    }
  };

  const handleOpenTransaction = (product) => {
    setSelectedProduct(product);
    setTransactionData({
      transaction_type: '',
      quantity: '',
      unit_price: '',
      reference: '',
      notes: ''
    });
    setOpenTransactionDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      current_quantity: '',
      unit: 'pieces',
      min_stock_level: ''
    });
    setEditingProduct(null);
  };

  const resetTransactionForm = () => {
    setTransactionData({
      transaction_type: 'purchase',
      quantity: '',
      unit_price: '',
      reference: '',
      notes: ''
    });
    setSelectedProduct(null);
  };

  const getStockStatus = (product) => {
    if (product.current_quantity <= product.min_stock_level) {
      return { color: 'error', label: 'Low Stock', icon: <WarningIcon /> };
    } else if (product.current_quantity <= product.min_stock_level * 1.5) {
      return { color: 'warning', label: 'Low Stock', icon: <WarningIcon /> };
    }
    return { color: 'success', label: 'In Stock', icon: null };
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 || newValue === 2) {
      fetchAllTransactions();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Product Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setOpenDialog(true); resetForm(); }}
        >
          Add Product
        </Button>
      </Box>

      {/* Stats Cards - Mobile First Responsive */}
      {stats && (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Total Products
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.total_products || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Total Value Produced
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {formatIndianCurrency(stats.total_production_value || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Total Value Purchased
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {formatIndianCurrency(stats.total_purchase_value || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Total Value Sold
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {formatIndianCurrency(stats.total_sales_value || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Low Stock Items
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: stats.low_stock_count > 0 ? 'error.main' : 'success.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {stats.low_stock_count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Message */}
      {message && (
        <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* Instructional Message */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        backgroundColor: '#e3f2fd', 
        borderRadius: 1, 
        border: '1px solid #2196f3',
        textAlign: 'center'
      }}>
        <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
          💡 <strong>Tip:</strong> Click the <strong>+ (Add) button</strong> in the Actions column to record transactions (sales, purchases, production)
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Products" />
          <Tab label="Sales History" />
          <Tab label="Produced History" />
          <Tab label="Purchased History" />
        </Tabs>
      </Box>

      {/* Products Tab */}
      {tabValue === 0 && (
        <>
          {/* Search */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <TextField
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { fetchProducts(); fetchStats(); }}
            >
              Refresh
            </Button>
          </Box>

          {/* Products Table - Mobile Responsive */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              overflowX: 'auto',
              '& .MuiTableContainer-root': {
                maxWidth: '100%'
              }
            }}
          >
            <Table sx={{ minWidth: { xs: 600, sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.1rem' }, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                    px: { xs: 1, sm: 1.5 }
                  }}>Product</TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.1rem' }, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                    px: { xs: 1, sm: 1.5 }
                  }}>SKU</TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.1rem' }, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                    px: { xs: 1, sm: 1.5 }
                  }}>Current Qty</TableCell>
                  <TableCell align="center" sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.1rem' }, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                    px: { xs: 1, sm: 1.5 }
                  }}>Status</TableCell>
                  <TableCell align="center" sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1.1rem' }, 
                    fontWeight: 'bold', 
                    color: 'primary.main',
                    whiteSpace: 'nowrap',
                    px: { xs: 1, sm: 1.5 }
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No products found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {product.current_quantity} {product.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stockStatus.label}
                            color={stockStatus.color}
                            size="small"
                            icon={stockStatus.icon}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Tooltip title="Record Transaction (Sale/Purchase/Production)">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenTransaction(product)}
                                color="primary"
                              >
                                <AddIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(product)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(product.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2 }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Sales History Tab */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.filter(t => t.transaction_type === 'sale').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No sales history found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions
                  .filter(transaction => transaction.transaction_type === 'sale')
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {transaction.product_name || 'Product'}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                          {formatIndianCurrency(transaction.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.reference || '-'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Produced History Tab */}
      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.filter(t => t.transaction_type === 'production').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No production history found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions
                  .filter(transaction => transaction.transaction_type === 'production')
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {transaction.product_name || 'Product'}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 'bold' }}>
                          {formatIndianCurrency(transaction.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.reference || '-'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Purchased History Tab */}
      {tabValue === 3 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.filter(t => t.transaction_type === 'purchase').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No purchase history found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions
                  .filter(transaction => transaction.transaction_type === 'purchase')
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {transaction.product_name || 'Product'}
                        </Typography>
                      </TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          {formatIndianCurrency(transaction.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.reference || '-'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <MenuItem value="pieces">Pieces</MenuItem>
                    <MenuItem value="kg">Kilograms</MenuItem>
                    <MenuItem value="liters">Liters</MenuItem>
                    <MenuItem value="meters">Meters</MenuItem>
                    <MenuItem value="boxes">Boxes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Quantity"
                  type="number"
                  value={formData.current_quantity}
                  onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Min Stock Level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={openTransactionDialog} onClose={() => setOpenTransactionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Record Transaction - {selectedProduct?.name}
        </DialogTitle>
        <form onSubmit={handleTransactionSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity *"
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Transaction Type *</InputLabel>
                  <Select
                    value={transactionData.transaction_type}
                    onChange={(e) => {
                      const newTransactionType = e.target.value;
                      let defaultPrice = '';
                      
                      if (selectedProduct) {
                        if (newTransactionType === 'sale') {
                          defaultPrice = selectedProduct.selling_price.toString();
                        } else if (newTransactionType === 'purchase') {
                          defaultPrice = selectedProduct.purchasing_price.toString();
                        } else if (newTransactionType === 'production') {
                          defaultPrice = selectedProduct.purchasing_price.toString();
                        }
                      }
                      
                      setTransactionData({ 
                        ...transactionData, 
                        transaction_type: newTransactionType,
                        unit_price: defaultPrice
                      });
                    }}
                    required
                  >
                    <MenuItem value="sale">Sale</MenuItem>
                    <MenuItem value="purchase">Purchase</MenuItem>
                    <MenuItem value="production">Produced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={transactionData.transaction_type === 'sale' ? 'Selling Price *' : 
                         transactionData.transaction_type === 'purchase' ? 'Purchase Price *' : 
                         'Production Price *'}
                  type="number"
                  value={transactionData.unit_price}
                  onChange={(e) => setTransactionData({ ...transactionData, unit_price: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Total Amount: {formatIndianCurrency((parseFloat(transactionData.quantity || 0) * parseFloat(transactionData.unit_price || 0)).toFixed(2))}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reference"
                  value={transactionData.reference}
                  onChange={(e) => setTransactionData({ ...transactionData, reference: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTransactionDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Record Transaction
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Products;
