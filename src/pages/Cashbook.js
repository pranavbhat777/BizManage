import React, { useState, useEffect } from 'react';
import { formatIndianCurrency, formatCurrencyWithSign } from '../utils/currencyFormat';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Pagination,
  Fab,
  Zoom,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Phone as PhoneIcon,
  Notifications as ReminderIcon,
  NotificationsActive as BellIcon,
  Send as SendIcon
} from '@mui/icons-material';

const Cashbook = () => {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    type: 'in',
    amount: '',
    name: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    contact_number: '',
    proof_type: '',
    proof_description: '',
    reminder_enabled: false,
    reminder_message: '',
    reminder_interval_days: 7,
    reminder_schedule_type: 'interval', // 'interval' or 'manual'
    reminder_interval_enabled: true, // for interval scheduling
    reminder_manual_enabled: false // for manual sending only
  });
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');

  // Fetch cashbook entries
  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams({
        page: page,
        limit: 50
      });
      
      const response = await fetch(`http://localhost:5000/api/cashbook?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
        setSummary({
          balance: data.balance,
          total_in: data.total_in,
          total_out: data.total_out
        });
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cashbook/summary?period=month', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate only required fields before sending
      if (!formData.name || !formData.amount || !formData.date || !formData.time || !formData.contact_number) {
        setMessage('Please fill in all required fields (Name, Amount, Date, Time, and Contact Number)');
        return;
      }
      
      // Convert empty optional fields to null for backend
      const backendData = {
        ...formData,
        title: formData.title || null,
        proof_type: formData.proof_type || null,
        proof_description: formData.proof_description || null,
        reminder_message: formData.reminder_message || null
      };
      
      const url = editingEntry 
        ? `http://localhost:5000/api/cashbook/${editingEntry.id}`
        : 'http://localhost:5000/api/cashbook';
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle netting responses
        if (data.netted) {
          const netMessage = data.netted.remaining === 0 
            ? `Entry updated and fully netted: ${data.netted.deleted} entries deleted`
            : `Entry updated and netted: ${data.netted.deleted} deleted, ${data.netted.updated} updated`;
          setMessage(netMessage);
        } else {
          setMessage('Entry updated successfully');
        }
        
        setOpenDialog(false);
        setEditingEntry(null);
        resetForm();
        fetchEntries();
        fetchSummary();
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        if (error.errors && error.errors.length > 0) {
          const errorMessages = error.errors.map(err => err.msg).join(', ');
          setMessage(`Validation Error: ${errorMessages}`);
        } else {
          setMessage(error.message || 'Error saving entry');
        }
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setMessage('Error saving entry');
    }
  };

  // Handle net all entries
  const handleNetAll = async () => {
    if (!window.confirm('This will net all matching entries and delete pairs with equal amounts. Continue?')) {
      return;
    }
    
    try {
      // Get unique phone numbers
      const uniquePhoneNumbers = [...new Set(entries.map(entry => entry.contact_number))];
      let totalNetted = 0;
      
      for (const phoneNumber of uniquePhoneNumbers) {
        const response = await fetch('http://localhost:5000/api/cashbook/net-manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ contact_number: phoneNumber })
        });
        
        if (response.ok) {
          const data = await response.json();
          totalNetted += data.nettedPairs;
        }
      }
      
      setMessage(`Netting completed: ${totalNetted} pairs netted and deleted`);
      fetchEntries();
      fetchSummary();
    } catch (error) {
      console.error('Error netting entries:', error);
      setMessage('Error netting entries');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!id) {
      setMessage('Cannot delete entry: Invalid ID');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/cashbook/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setMessage('Entry deleted successfully');
        fetchEntries();
        fetchSummary();
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error deleting entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      setMessage('Error deleting entry');
    }
  };

  // Handle send reminder
  const sendReminder = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cashbook/${id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Reminder sent successfully via WhatsApp!');
        
        // Open WhatsApp with pre-filled message
        if (data.entry && data.entry.contact_number) {
          const message = encodeURIComponent(data.entry.reminder_message);
          const whatsappUrl = `https://wa.me/${data.entry.contact_number.replace(/[^0-9]/g, '')}?text=${message}`;
          window.open(whatsappUrl, '_blank');
        }
      } else {
        setMessage(data.message || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Send reminder error:', error);
      setMessage('Failed to send reminder');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'in',
      amount: '',
      name: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      contact_number: '',
      proof_type: '',
      proof_description: '',
      reminder_enabled: false,
      reminder_message: '',
      reminder_interval_days: 7,
      reminder_schedule_type: 'interval',
      reminder_interval_enabled: true,
      reminder_manual_enabled: false
    });
  };

  // Open dialog for editing
  const openEditDialog = (entry) => {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      amount: entry.amount,
      name: entry.name,
      title: entry.title,
      date: entry.date,
      time: entry.time,
      contact_number: entry.contact_number,
      proof_type: entry.proof_type || '',
      proof_description: entry.proof_description || '',
      reminder_enabled: entry.reminder_enabled || false,
      reminder_message: entry.reminder_message || '',
      reminder_interval_days: entry.reminder_interval_days || 7,
      reminder_schedule_type: entry.reminder_schedule_type || 'interval',
      reminder_interval_enabled: entry.reminder_interval_enabled !== false,
      reminder_manual_enabled: entry.reminder_manual_enabled || false
    });
    setOpenDialog(true);
  };

  useEffect(() => {
    Promise.all([fetchEntries(), fetchSummary()]).finally(() => {
      setLoading(false);
    });
  }, [page]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Cashbook Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#e8f5e8', borderLeft: '4px solid #4caf50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                Total Payments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatIndianCurrency((summary?.total_in || 0) + (summary?.total_out || 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                Total Given
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatIndianCurrency(summary?.total_out || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                Total Received
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatIndianCurrency(summary?.total_in || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                Current Balance
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatIndianCurrency(summary?.balance || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Netting Info Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f7ff', border: '1px solid #2196f3' }}>
        <Typography variant="h6" sx={{ color: '#1976d2', mb: 1 }}>
          🔄 Automatic Netting Feature
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Contact numbers are now MANDATORY for all transactions</strong> - both when you give money and when you receive money. 
          The system automatically nets (cancels out) transactions with the same phone number when you add new entries. 
          For example, if you gave ₹1000 to someone (phone: 9876543210) and later received ₹1000 from the same person, 
          both entries will be automatically cancelled using the phone number as unique identifier.
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ mt: 1 }}
          onClick={() => setMessage('Netting runs automatically when adding entries. Use "Net All Entries" to manually net existing entries.')}
        >
          Learn More
        </Button>
      </Paper>

      {/* Entries Table */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: '600' }}>
            Cashbook Entries
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleNetAll}
            sx={{ ml: 2 }}
          >
            🔄 Net All Entries
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Proof</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{entry.name}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.time}</TableCell>
                  <TableCell>
                    <Chip
                      label={entry.type === 'out' ? '💰 Gave' : '💵 Received'}
                      color={entry.type === 'out' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{entry.title}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: entry.type === 'in' ? 'green' : 'orange' }}>
                    {formatCurrencyWithSign(entry.amount, entry.type)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {entry.contact_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {entry.proof_type && (
                      <Chip
                        label={entry.proof_type}
                        variant="outlined"
                        size="small"
                        icon={<DescriptionIcon />}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEditDialog(entry)} color="primary">
                      <EditIcon />
                    </IconButton>
                    {entry.type === 'out' && (entry.reminder_enabled === true || entry.reminder_enabled === 1) && (entry.reminder_schedule_type === 'manual' || entry.reminder_schedule_type === 'both') && (
                      <IconButton 
                        onClick={() => sendReminder(entry.id)} 
                        color="secondary" 
                        title="Send Reminder via WhatsApp"
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#25D366',
                            color: 'white'
                          }
                        }}
                      >
                        <BellIcon />
                      </IconButton>
                    )}
                    {entry.id && (
                      <IconButton onClick={() => handleDelete(entry.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {entries.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography>No entries found</Typography>
          </Box>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Edit Cashbook Entry' : 'Add Cashbook Entry'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="in">📥 Received (You got money)</MenuItem>
                  <MenuItem value="out">📤 Gave (You gave money)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                helperText="Optional"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                required
                error={!formData.contact_number}
                helperText={!formData.contact_number ? "Contact number is required for all transactions" : "Required for all transactions (used for automatic net cancelling)"}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Proof Type</InputLabel>
                <Select
                  value={formData.proof_type}
                  onChange={(e) => setFormData({ ...formData, proof_type: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="receipt">Receipt</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="bank_statement">Bank Statement</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Proof Description"
                multiline
                rows={2}
                value={formData.proof_description}
                onChange={(e) => setFormData({ ...formData, proof_description: e.target.value })}
              />
            </Grid>
            
            {/* Reminder Section - Only show for money given out */}
            {formData.type === 'out' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReminderIcon />
                    Reminder Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.reminder_enabled}
                        onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                      />
                    }
                    label="Enable Reminders"
                  />
                </Grid>
                
                {formData.reminder_enabled && (
                  <>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        backgroundColor: '#fff3cd', 
                        borderRadius: 1, 
                        border: '1px solid #ffc107',
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: '#856404', fontWeight: 500 }}>
                          ⬇️ <strong>Scroll down</strong> to configure reminder schedule and notification settings
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl component="fieldset">
                        <FormLabel component="legend">Reminder Schedule Type</FormLabel>
                        <RadioGroup
                          row
                          value={formData.reminder_schedule_type}
                          onChange={(e) => setFormData({ ...formData, reminder_schedule_type: e.target.value })}
                        >
                          <FormControlLabel 
                            value="interval" 
                            control={<Radio />} 
                            label="Send reminders at regular intervals" 
                          />
                          <FormControlLabel 
                            value="manual" 
                            control={<Radio />} 
                            label="Send reminders only when I click the button" 
                          />
                          <FormControlLabel 
                            value="both" 
                            control={<Radio />} 
                            label="Both - Intervals + Manual when needed" 
                          />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Personalized Reminder Message"
                        multiline
                        rows={3}
                        placeholder="Hi [Name], this is a reminder from [Business Name] about the outstanding amount of ₹[Amount]. Please settle it at your earliest convenience."
                        value={formData.reminder_message}
                        onChange={(e) => setFormData({ ...formData, reminder_message: e.target.value })}
                        helperText="Use [Name], [Amount], and [Business Name] as placeholders that will be replaced automatically"
                      />
                    </Grid>
                    
                    {(formData.reminder_schedule_type === 'interval' || formData.reminder_schedule_type === 'both') && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Reminder Interval (Days)"
                          type="number"
                          value={formData.reminder_interval_days}
                          onChange={(e) => setFormData({ ...formData, reminder_interval_days: parseInt(e.target.value) || 7 })}
                          helperText="How often to send automatic reminders"
                          inputProps={{ min: 1, max: 365 }}
                        />
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        {formData.reminder_schedule_type === 'interval' && '🔄 Automatic reminders will be sent at your chosen interval'}
                        {formData.reminder_schedule_type === 'manual' && '👆 Click the bell icon to send reminders manually whenever you want'}
                        {formData.reminder_schedule_type === 'both' && '🔄 Automatic reminders at intervals + 👆 Manual reminders via bell icon anytime'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </>
            )}
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
            {editingEntry ? 'Update' : 'Add'} Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => {
          setEditingEntry(null);
          resetForm();
          setOpenDialog(true);
        }}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Cashbook;
