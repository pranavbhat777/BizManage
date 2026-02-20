import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Checkbox,
  ListItemText,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Done as DoneIcon
} from '@mui/icons-material';

const Payroll = () => {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [generateForm, setGenerateForm] = useState({
    period_start: '',
    period_end: '',
    period_type: 'monthly'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [updatedPayrollIds, setUpdatedPayrollIds] = useState(new Set());
  const [payrollPreview, setPayrollPreview] = useState(null);
  const [dateError, setDateError] = useState('');

  // Validate date range
  const validateDateRange = (startDate, endDate) => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        setDateError('Start date cannot be greater than end date');
        return false;
      } else {
        setDateError('');
        return true;
      }
    }
    setDateError('');
    return true;
  };

  // Calculate payroll preview
  const calculatePayrollPreview = async () => {
    if (!generateForm.period_start || !generateForm.period_end || selectedEmployees.length === 0) {
      setPayrollPreview(null);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/payroll/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...generateForm,
          employee_ids: selectedEmployees
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPayrollPreview(data);
      }
    } catch (error) {
      console.error('Error calculating preview:', error);
    }
  };

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch payroll records
  const fetchPayroll = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payroll', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayrollRecords(data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate payroll
  const handleGeneratePayroll = async () => {
    // Validate date range before generating
    if (!validateDateRange(generateForm.period_start, generateForm.period_end)) {
      setSnackbar({ open: true, message: 'Please fix date validation errors', severity: 'error' });
      return;
    }

    try {
      console.log('Generating payroll with data:', {
        ...generateForm,
        employee_ids: selectedEmployees
      });
      
      const response = await fetch('http://localhost:5000/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...generateForm,
          employee_ids: selectedEmployees
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setSnackbar({ open: true, message: `Error: ${errorText}`, severity: 'error' });
        return;
      }
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Payroll generated successfully', severity: 'success' });
        setOpenGenerateDialog(false);
        setSelectedEmployees([]);
        setGenerateForm({
          period_start: '',
          period_end: '',
          period_type: 'monthly'
        });
        fetchPayroll();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error generating payroll', severity: 'error' });
      }
    } catch (error) {
      console.error('Generate payroll error:', error);
      setSnackbar({ open: true, message: `Error generating payroll: ${error.message}`, severity: 'error' });
    }
  };

  // Update payroll status
  const handleUpdateStatus = async (payrollId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/${payrollId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
        fetchPayroll();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error updating status', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    }
  };

  // Update advance records when deduction is applied
  const handleUpdateAdvanceRecords = async (payrollRecord) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/${payrollRecord.id}/update-advances`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          advance_deduction: payrollRecord.advance_deduction 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Mark this payroll as updated
        setUpdatedPayrollIds(prev => new Set([...prev, payrollRecord.id]));
        
        // Show comprehensive success message
        let message = 'Advance records updated successfully';
        if (result.overtime_cleared > 0) {
          message += ` and ${result.overtime_cleared} overtime record(s) cleared`;
        }
        
        setSnackbar({ open: true, message: message, severity: 'success' });
        
        // Auto-delete after 2 seconds
        setTimeout(() => {
          handleDeletePayroll(payrollRecord.id, true); // Skip confirmation for auto-delete
        }, 2000);
        
        fetchPayroll(); // Refresh to show updated active advance amounts
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error updating advance records', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating advance records:', error);
      setSnackbar({ open: true, message: 'Error updating advance records', severity: 'error' });
    }
  };

  // Delete payroll record
  const handleDeletePayroll = async (payrollId, skipConfirmation = false) => {
    if (!skipConfirmation && !window.confirm('Are you sure you want to delete this payroll record?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/payroll/${payrollId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Payroll record deleted successfully', severity: 'success' });
        fetchPayroll();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error deleting payroll', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting payroll:', error);
      setSnackbar({ open: true, message: 'Error deleting payroll', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayroll();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning.main';
      case 'processed': return 'info.main';
      case 'paid': return 'success.main';
      default: return 'text.secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processed': return 'Processed';
      case 'paid': return 'Paid';
      default: return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
        Payroll Management
      </Typography>
      
      <Box sx={{ 
        mb: 2, 
        p: 2, 
        backgroundColor: '#e3f2fd', 
        borderRadius: 1, 
        border: '1px solid #1976d2'
      }}>
        <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
          💡 <strong>After payment is completed:</strong> Click the checkmark (✓) symbol to mark payroll as done, update advance records, and automatically clear overtime records for the payroll period.
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenGenerateDialog(true)}
          sx={{ 
            background: 'linear-gradient(45deg, #3498db 30%, #2980b9 90%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #2980b9 30%, #1f618d 90%)',
            }
          }}
        >
          Generate Payroll
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPayroll}
        >
          Refresh
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          onClick={async () => {
            try {
              const response = await fetch('http://localhost:5000/api/payroll/test', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ test: 'data' })
              });
              const result = await response.json();
              console.log('Test result:', result);
              setSnackbar({ open: true, message: 'Test API working!', severity: 'success' });
            } catch (error) {
              console.error('Test error:', error);
              setSnackbar({ open: true, message: 'Test API failed', severity: 'error' });
            }
          }}
        >
          Test API
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : payrollRecords.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography color="text.secondary">
            No payroll records found. Generate payroll to get started.
          </Typography>
        </Box>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Basic Pay</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Overtime Pay</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Earnings</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Active Advance</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Advance Deduction</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Net Salary</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {payrollRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    {record.first_name} {record.last_name}
                  </TableCell>
                  <TableCell>
                    {new Date(record.period_start).toLocaleDateString()} - {new Date(record.period_end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>₹{parseFloat(record.base_salary).toLocaleString()}</TableCell>
                  <TableCell>₹{parseFloat(record.overtime_amount).toLocaleString()}</TableCell>
                  <TableCell>₹{(parseFloat(record.base_salary) + parseFloat(record.overtime_amount)).toLocaleString()}</TableCell>
                  <TableCell>
                    {(() => {
                      try {
                        const notes = JSON.parse(record.notes || '{}');
                        return (notes.active_advance_amount || 0).toLocaleString();
                      } catch {
                        return '0';
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={record.advance_deduction || 0}
                      onChange={async (e) => {
                        const newDeduction = parseFloat(e.target.value) || 0;
                        const newNetSalary = (parseFloat(record.base_salary) + parseFloat(record.overtime_amount)) - newDeduction;
                        
                        // Update record locally
                        const updatedRecords = payrollRecords.map(r => 
                          r.id === record.id 
                            ? { ...r, advance_deduction: newDeduction, net_salary: newNetSalary }
                            : r
                        );
                        setPayrollRecords(updatedRecords);
                        
                        // Update on backend
                        try {
                          const response = await fetch(`http://localhost:5000/api/payroll/${record.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                              advance_deduction: newDeduction,
                              net_salary: newNetSalary 
                            })
                          });
                          
                          if (response.ok) {
                            setSnackbar({ open: true, message: 'Advance deduction updated', severity: 'success' });
                          }
                        } catch (error) {
                          console.error('Error updating deduction:', error);
                        }
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: '120px' }}
                    />
                  </TableCell>
                  <TableCell>₹{parseFloat(record.net_salary).toLocaleString()}</TableCell>
                  <TableCell>
                    <Tooltip title={updatedPayrollIds.has(record.id) ? "Advance Records Updated - Auto-deleting..." : "Done - Click to update advance records and mark payroll as complete"}>
                      <IconButton 
                        color={updatedPayrollIds.has(record.id) ? "primary" : "success"}
                        onClick={() => handleUpdateAdvanceRecords(record)}
                      >
                        <DoneIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      )}

      {/* Generate Payroll Dialog */}
      <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          {/* Payroll Period Section */}
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 1, 
            border: '2px solid #1976d2'
          }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              color: '#1565c0', 
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              📅 Payroll Period
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Period Start"
                  type="date"
                  fullWidth
                  value={generateForm.period_start}
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setGenerateForm({ ...generateForm, period_start: newStartDate });
                    validateDateRange(newStartDate, generateForm.period_end);
                  }}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      fontWeight: 'bold',
                      color: 'primary.main'
                    }
                  }}
                  InputProps={{
                    sx: {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1976d2',
                          borderWidth: 2
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2'
                        }
                      }
                    }
                  }}
                  error={dateError.includes('Start date')}
                  helperText={dateError.includes('Start date') ? 'Please select a valid start date' : ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Period End"
                  type="date"
                  fullWidth
                  value={generateForm.period_end}
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    setGenerateForm({ ...generateForm, period_end: newEndDate });
                    validateDateRange(generateForm.period_start, newEndDate);
                  }}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      fontWeight: 'bold',
                      color: 'primary.main'
                    }
                  }}
                  InputProps={{
                    sx: {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#1976d2',
                          borderWidth: 2
                        },
                        '&:hover fieldset': {
                          borderColor: '#1976d2'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2'
                        }
                      }
                    }
                  }}
                  error={dateError.includes('end date')}
                  helperText={dateError.includes('end date') ? 'Please select a valid end date' : ''}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Employee Selection Section */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Period Type</InputLabel>
                <Select
                  value={generateForm.period_type}
                  onChange={(e) => setGenerateForm({ ...generateForm, period_type: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {dateError && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {dateError}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>
                  Select Employees
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    if (selectedEmployees.length === employees.length) {
                      setSelectedEmployees([]);
                    } else {
                      setSelectedEmployees(employees.map(emp => emp.id));
                    }
                  }}
                >
                  {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #ddd', p: 1, borderRadius: 1 }}>
                {employees.map((employee) => (
                  <Box key={employee.id} sx={{ mb: 1 }}>
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, employee.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                        }
                      }}
                    />
                    <ListItemText 
                      primary={`${employee.first_name} ${employee.last_name}`}
                      secondary={employee.employee_code}
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGeneratePayroll}
            variant="contained"
            disabled={selectedEmployees.length === 0 || !generateForm.period_start || !generateForm.period_end || dateError !== ''}
          >
            Generate Payroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payroll;
