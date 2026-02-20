import React, { useState, useEffect } from 'react';
import { formatIndianCurrency } from '../utils/currencyFormat';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  Chip,
  Fab,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationIcon,
  Security as InsuranceIcon,
  Warning as WarningIcon,
  CheckCircle as ActiveIcon,
  Cancel as ExpiredIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import moment from 'moment';

const InsuranceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
  },
  '& svg': {
    fontSize: '3rem',
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  '& h4': {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  '& p': {
    fontSize: '1.5rem',
    fontWeight: 500,
    color: theme.palette.text.primary,
  },
}));

const Insurance = () => {
  const [loading, setLoading] = useState(true);
  const [insurance, setInsurance] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [formData, setFormData] = useState({
    policy_name: '',
    insurance_company: '',
    policy_number: '',
    policy_type: 'health',
    policy_premium: '',
    premium_frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date().toISOString().split('T')[0],
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    coverage_details: '',
    notes: '',
    active: true,
    vehicle_number: ''
  });
  const [message, setMessage] = useState('');

  // Fetch insurance policies
  const fetchInsurance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/insurance', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsurance(data);
      } else {
        console.error('Failed to fetch insurance policies');
      }
    } catch (error) {
      console.error('Error fetching insurance policies:', error);
    }
  };

  // Fetch expiring soon policies
  const fetchExpiringSoon = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/insurance/expiring-soon', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExpiringSoon(data);
      } else {
        console.error('Failed to fetch expiring policies');
      }
    } catch (error) {
      console.error('Error fetching expiring policies:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const url = editingInsurance 
        ? `http://localhost:5000/api/insurance/${editingInsurance.id}`
        : 'http://localhost:5000/api/insurance';
      
      const method = editingInsurance ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setMessage(editingInsurance ? 'Insurance policy updated successfully' : 'Insurance policy created successfully');
        setOpenDialog(false);
        setEditingInsurance(null);
        resetForm();
        fetchInsurance();
        fetchExpiringSoon();
      } else {
        const error = await response.json();
        console.error('Backend validation errors:', error);
        
        // Show specific validation errors
        if (error.errors && Array.isArray(error.errors)) {
          const phoneError = error.errors.find(err => err.msg.includes('Phone number'));
          if (phoneError) {
            setMessage(phoneError.msg);
          } else {
            setMessage(error.errors[0].msg);
          }
        } else {
          setMessage(error.message || 'Error saving insurance policy');
        }
      }
    } catch (error) {
      console.error('Error saving insurance policy:', error);
      setMessage('Error saving insurance policy');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this insurance policy?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/insurance/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setMessage('Insurance policy deleted successfully');
        fetchInsurance();
        fetchExpiringSoon();
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error deleting insurance policy');
      }
    } catch (error) {
      console.error('Error deleting insurance policy:', error);
      setMessage('Error deleting insurance policy');
    }
  };

  // Send notification
  const sendNotification = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/insurance/${id}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Expiry notification sent successfully via WhatsApp!');
        fetchInsurance();
        
        // Open WhatsApp with pre-filled message
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      } else {
        setMessage(data.message || 'Error sending notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage('Error sending notification');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      policy_name: '',
      insurance_company: '',
      policy_number: '',
      policy_type: 'health',
      policy_premium: '',
      premium_frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      coverage_details: '',
      notes: '',
      active: true,
      vehicle_number: ''
    });
  };

  // Open dialog for editing
  const openEditDialog = (insurance) => {
    setEditingInsurance(insurance);
    setFormData({
      policy_name: insurance.policy_name,
      insurance_company: insurance.insurance_company,
      policy_number: insurance.policy_number,
      policy_type: insurance.policy_type,
      premium_amount: insurance.premium_amount,
      premium_frequency: insurance.premium_frequency,
      start_date: insurance.start_date,
      expiry_date: insurance.expiry_date,
      contact_person: insurance.contact_person,
      contact_phone: insurance.contact_phone,
      contact_email: insurance.contact_email || '',
      coverage_details: insurance.coverage_details || '',
      notes: insurance.notes || '',
      active: insurance.active,
      vehicle_number: insurance.vehicle_number || ''
    });
    setOpenDialog(true);
  };

  // Get expiry status
  const getExpiryStatus = (expiryDate) => {
    const today = moment();
    const expiry = moment(expiryDate);
    const daysUntilExpiry = expiry.diff(today, 'days');
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'error', icon: <ExpiredIcon />, text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'warning', icon: <WarningIcon />, text: `${daysUntilExpiry} days left` };
    } else {
      return { status: 'active', color: 'success', icon: <ActiveIcon />, text: 'Active' };
    }
  };

  useEffect(() => {
    Promise.all([fetchInsurance(), fetchExpiringSoon()]).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading insurance policies...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
        <InsuranceIcon />
        Insurance Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <InsuranceCard elevation={3}>
            <InsuranceIcon />
            <Typography variant="h6">Total Policies</Typography>
            <Typography variant="h4">{insurance.length}</Typography>
          </InsuranceCard>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <InsuranceCard elevation={3}>
            <ActiveIcon />
            <Typography variant="h6">Active Policies</Typography>
            <Typography variant="h4">
              {insurance.filter(i => {
                const expiryDate = moment(i.expiry_date);
                const today = moment();
                const daysUntilExpiry = expiryDate.diff(today, 'days');
                return i.active && daysUntilExpiry >= 0;
              }).length}
            </Typography>
          </InsuranceCard>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <InsuranceCard elevation={3}>
            <WarningIcon />
            <Typography variant="h6">Expiring Soon</Typography>
            <Typography variant="h4">{expiringSoon.length}</Typography>
          </InsuranceCard>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <InsuranceCard elevation={3}>
            <ExpiredIcon />
            <Typography variant="h6">Expired Policies</Typography>
            <Typography variant="h4">
              {insurance.filter(i => {
                const expiryDate = moment(i.expiry_date);
                const today = moment();
                const daysUntilExpiry = expiryDate.diff(today, 'days');
                return daysUntilExpiry < 0;
              }).length}
            </Typography>
          </InsuranceCard>
        </Grid>
      </Grid>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">⚠️ {expiringSoon.length} Insurance Policies Expiring Soon!</Typography>
          <Typography variant="body2">
            The following policies will expire within 30 days. Please renew them to avoid coverage gaps.
          </Typography>
        </Alert>
      )}

      {/* Insurance Table */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Insurance Policies</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Policy Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Premium</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insurance.map((policy) => {
                const expiryStatus = getExpiryStatus(policy.expiry_date);
                return (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {policy.policy_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {policy.policy_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{policy.insurance_company}</TableCell>
                    <TableCell>
                      <Chip 
                        label={policy.policy_type.charAt(0).toUpperCase() + policy.policy_type.slice(1)} 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {formatIndianCurrency(parseFloat(policy.premium_amount))}/{policy.premium_frequency}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {moment(policy.expiry_date).format('DD MMM YYYY')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={expiryStatus.icon}
                        label={expiryStatus.text}
                        color={expiryStatus.color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditDialog(policy)} color="primary">
                        <EditIcon />
                      </IconButton>
                      {expiryStatus.status === 'expiring' && (
                        <IconButton 
                          onClick={() => sendNotification(policy.id)} 
                          color="secondary"
                          title="Send Expiry Notification"
                        >
                          <NotificationIcon />
                        </IconButton>
                      )}
                      <IconButton onClick={() => handleDelete(policy.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInsurance ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Name"
                value={formData.policy_name}
                onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Insurance Company"
                value={formData.insurance_company}
                onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Policy Number"
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Policy Type</InputLabel>
                <Select
                  value={formData.policy_type}
                  onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                >
                  <MenuItem value="health">Health</MenuItem>
                  <MenuItem value="life">Life</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="property">Property</MenuItem>
                  <MenuItem value="travel">Travel</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Vehicle Number Field - Always show but only required for vehicle policies */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={formData.policy_type === 'vehicle' ? 'Vehicle Number *' : 'Vehicle Number'}
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                placeholder="Enter vehicle registration number"
                required={formData.policy_type === 'vehicle'}
                helperText={formData.policy_type === 'vehicle' ? 'Vehicle registration number is required for vehicle policies' : 'Optional - only for vehicle policies'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Premium Amount"
                type="number"
                value={formData.premium_amount}
                onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Premium Frequency</InputLabel>
                <Select
                  value={formData.premium_frequency}
                  onChange={(e) => setFormData({ ...formData, premium_frequency: e.target.value })}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Expiry Date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Person Responsible for Renewal
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.contact_phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9+\-\s()]/g, ''); // Only allow numbers and phone symbols
                  setFormData({ ...formData, contact_phone: value });
                }}
                required
                helperText="Enter 10-15 digits (numbers only)"
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Coverage Details"
                multiline
                rows={3}
                value={formData.coverage_details}
                onChange={(e) => setFormData({ ...formData, coverage_details: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
          
          {message && (
            <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingInsurance ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add insurance"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => {
          resetForm();
          setEditingInsurance(null);
          setOpenDialog(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
      >
        <Alert 
          onClose={() => setMessage('')} 
          severity={message.includes('success') ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Insurance;
