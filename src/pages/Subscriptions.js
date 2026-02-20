import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Fab,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    start_date: '',
    end_date: '',
    status: 'active'
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      // Mock data for now since we're removing authentication
      const mockSubscriptions = [
        {
          id: 1,
          name: 'Netflix Premium',
          description: 'Entertainment streaming service',
          amount: '15.99',
          frequency: 'monthly',
          start_date: '2024-01-01',
          end_date: '2025-01-01',
          status: 'active'
        },
        {
          id: 2,
          name: 'Adobe Creative Cloud',
          description: 'Design software subscription',
          amount: '19.99',
          frequency: 'monthly',
          start_date: '2024-01-15',
          end_date: '2025-01-15',
          status: 'active'
        }
      ];
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subscription = null) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setFormData({
        name: subscription.name,
        description: subscription.description,
        amount: subscription.amount,
        frequency: subscription.frequency,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status
      });
    } else {
      setEditingSubscription(null);
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSubscription(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      frequency: 'monthly',
      start_date: '',
      end_date: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mock save operation
      console.log('Saving subscription:', formData);
      
      if (editingSubscription) {
        // Update existing subscription
        console.log('Updating subscription:', editingSubscription.id);
      } else {
        // Create new subscription
        console.log('Creating new subscription');
      }
      
      handleCloseDialog();
      fetchSubscriptions();
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Mock delete operation
      console.log('Deleting subscription:', id);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subscriptions
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mb: 3 }}
      >
        Add Subscription
      </Button>

      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={fetchSubscriptions}
        sx={{ mb: 3, ml: 2 }}
      >
        Refresh
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.name}</TableCell>
                  <TableCell>{subscription.description}</TableCell>
                  <TableCell>${subscription.amount}</TableCell>
                  <TableCell>{subscription.frequency}</TableCell>
                  <TableCell>
                    <Chip
                      label={subscription.status}
                      color={getStatusColor(subscription.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(subscription)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(subscription.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Frequency"
                name="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSubscription ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subscriptions;
