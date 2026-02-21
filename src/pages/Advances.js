import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon
} from '@mui/icons-material';
const Advances = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    employee_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [filterEmployee, setFilterEmployee] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  
  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Advances - Employees response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Advances - Employees response data:', data);
        console.log('Advances - Setting employees:', data);
        setEmployees(data);
      } else {
        console.error('Advances - Error response:', response.status, response.statusText);
        setSnackbar({ open: true, message: 'Error fetching employees', severity: 'error' });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({ open: true, message: 'Error fetching employees', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch advances
  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/advances', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdvances(data);
      }
    } catch (error) {
      console.error('Error fetching advances:', error);
      setSnackbar({ open: true, message: 'Error fetching advances', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingAdvance 
        ? `http://localhost:5000/api/advances/${editingAdvance.id}`
        : 'http://localhost:5000/api/advances';
      
      const method = editingAdvance ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSnackbar({ open: true, message: data.message, severity: 'success' });
        
        if (editingAdvance) {
          setAdvances(advances.map(advance => 
            advance.id === editingAdvance.id ? data.advance : advance
          ));
          setEditingAdvance(null);
          setShowAddForm(false);
        } else {
          setAdvances([...advances, data.advance]);
        }
        
        setFormData({
          employee_id: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
      } else {
        const errorData = await response.json();
        setSnackbar({ open: true, message: errorData.message || 'Error saving advance', severity: 'error' });
      }
    } catch (error) {
      console.error('Error saving advance:', error);
      setSnackbar({ open: true, message: 'Error saving advance', severity: 'error' });
    }
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({
      employee_id: advance.employee_id,
      amount: advance.amount,
      date: advance.date.split('T')[0],
      notes: advance.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (advanceId) => {
    if (window.confirm('Are you sure you want to delete this advance record?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/advances/${advanceId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setAdvances(advances.filter(advance => advance.id !== advanceId));
          setSnackbar({ open: true, message: 'Advance deleted successfully', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Error deleting advance', severity: 'error' });
        }
      } catch (error) {
        console.error('Error deleting advance:', error);
        setSnackbar({ open: true, message: 'Error deleting advance', severity: 'error' });
      }
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingAdvance(null);
    setFormData({
      employee_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // Group advances by employee and calculate common remaining balance
  const getEmployeeAdvanceSummary = () => {
    const employeeAdvances = {};
    
    advances.forEach(advance => {
      const employeeKey = advance.employee_id;
      if (!employeeAdvances[employeeKey]) {
        employeeAdvances[employeeKey] = {
          employee_id: advance.employee_id,
          employee_code: advance.employee_code,
          first_name: advance.first_name,
          last_name: advance.last_name,
          total_advance: 0,
          total_remaining: 0,
          advance_count: 0
        };
      }
      
      employeeAdvances[employeeKey].total_advance += parseFloat(advance.amount || 0);
      employeeAdvances[employeeKey].total_remaining += parseFloat(advance.balance_remaining || 0);
      employeeAdvances[employeeKey].advance_count += 1;
    });
    
    return Object.values(employeeAdvances);
  };

  const filteredAdvances = advances.filter(advance =>
    advance.first_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    advance.last_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    advance.employee_code?.toLowerCase().includes(filterEmployee.toLowerCase())
  );

  const filteredEmployeeAdvances = getEmployeeAdvanceSummary().filter(emp =>
    emp.first_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(filterEmployee.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Advance Payments Management
      </Typography>

      {snackbar.open && (
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {editingAdvance ? 'Edit Advance' : 'Add New Advance'}
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Employee</InputLabel>
                      <Select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        fullWidth
                        required
                      >
                        {employees.map(employee => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name} ({employee.employee_code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Amount (₹)"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    {editingAdvance ? 'Update Advance' : 'Add Advance'}
                  </Button>
                  
                  {showAddForm && (
                    <Button
                      variant="outlined"
                      onClick={handleCloseForm}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter Employees
              </Typography>
              <TextField
                fullWidth
                placeholder="Search by name or employee code..."
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                InputProps={{
                  startAdornment: <PersonIcon />
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={1}>
            <Typography variant="h6" sx={{ p: 2, mb: 2 }}>
              Advance Records - Employee Summary
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : filteredEmployeeAdvances.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">
                  No advance records found
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Total Advances (₹)</TableCell>
                    <TableCell>Remaining Balance (₹)</TableCell>
                    <TableCell>No. of Advances</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployeeAdvances.map((empAdvance) => (
                    <TableRow key={empAdvance.employee_id}>
                      <TableCell>{empAdvance.employee_code}</TableCell>
                      <TableCell>{empAdvance.first_name} {empAdvance.last_name}</TableCell>
                      <TableCell>₹{empAdvance.total_advance.toLocaleString()}</TableCell>
                      <TableCell>₹{empAdvance.total_remaining.toLocaleString()}</TableCell>
                      <TableCell>{empAdvance.advance_count}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: empAdvance.total_remaining > 0 ? 'success.main' : 'warning.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {empAdvance.total_remaining > 0 ? 'Active' : 'Cleared'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={1}>
            <Typography variant="h6" sx={{ p: 2, mb: 2 }}>
              Advance History
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : filteredAdvances.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">
                  No advance history found
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Balance Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAdvances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>
                        {advance.first_name} {advance.last_name}
                      </TableCell>
                      <TableCell>₹{parseFloat(advance.amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(advance.date).toLocaleDateString()}</TableCell>
                      <TableCell>{advance.notes || '-'}</TableCell>
                      <TableCell>₹{parseFloat(advance.balance_remaining).toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: advance.balance_remaining > 0 ? 'success.main' : 'warning.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {advance.balance_remaining > 0 ? 'Active' : 'Cleared'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEdit(advance)}
                          sx={{ mr: 1 }}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(advance.id)}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Advances;
