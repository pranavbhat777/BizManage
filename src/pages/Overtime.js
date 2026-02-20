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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TableContainer
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Overtime = () => {
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    rate: '',
    notes: ''
  });
  const [filterEmployee, setFilterEmployee] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOvertime, setEditingOvertime] = useState(null);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportForm, setReportForm] = useState({
    start_date: '',
    end_date: '',
    employee_id: ''
  });
  
  const navigate = useNavigate();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Overtime - Employees response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Overtime - Employees response data:', data);
        setEmployees(data);
      } else {
        console.error('Overtime - Error response:', response.status, response.statusText);
        setSnackbar({ open: true, message: 'Error fetching employees', severity: 'error' });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({ open: true, message: 'Error fetching employees', severity: 'error' });
    }
  };

  // Fetch overtime records
  const fetchOvertimeRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/overtime', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOvertimeRecords(data);
      }
    } catch (error) {
      console.error('Error fetching overtime records:', error);
      setSnackbar({ open: true, message: 'Error fetching overtime records', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchOvertimeRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingOvertime 
        ? `http://localhost:5000/api/overtime/${editingOvertime.id}`
        : 'http://localhost:5000/api/overtime';
      
      const method = editingOvertime ? 'PUT' : 'POST';
      
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
        
        if (editingOvertime) {
          setOvertimeRecords(overtimeRecords.map(record => 
            record.id === editingOvertime.id ? data.overtime : record
          ));
          setEditingOvertime(null);
          setShowAddForm(false);
        } else {
          setOvertimeRecords([...overtimeRecords, data.overtime]);
        }
        
        setFormData({
          employee_id: '',
          date: new Date().toISOString().split('T')[0],
          hours: '',
          rate: '',
          notes: ''
        });
      } else {
        const errorData = await response.json();
        setSnackbar({ open: true, message: errorData.message || 'Error saving overtime', severity: 'error' });
      }
    } catch (error) {
      console.error('Error saving overtime:', error);
      setSnackbar({ open: true, message: 'Error saving overtime', severity: 'error' });
    }
  };

  const handleEdit = (overtime) => {
    setEditingOvertime(overtime);
    setFormData({
      employee_id: overtime.employee_id,
      date: overtime.date.split('T')[0],
      hours: overtime.hours,
      rate: overtime.rate_multiplier,
      notes: overtime.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (overtimeId) => {
    if (window.confirm('Are you sure you want to delete this overtime record?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/overtime/${overtimeId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setOvertimeRecords(overtimeRecords.filter(record => record.id !== overtimeId));
          setSnackbar({ open: true, message: 'Overtime record deleted successfully', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Error deleting overtime', severity: 'error' });
        }
      } catch (error) {
        console.error('Error deleting overtime:', error);
        setSnackbar({ open: true, message: 'Error deleting overtime', severity: 'error' });
      }
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingOvertime(null);
    setFormData({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      rate: '',
      notes: ''
    });
  };

  const handleGenerateReport = async () => {
    try {
      const queryParams = new URLSearchParams({
        start_date: reportForm.start_date,
        end_date: reportForm.end_date
      });
      
      if (reportForm.employee_id) {
        queryParams.append('employee_id', reportForm.employee_id);
      }
      
      const response = await fetch(`http://localhost:5000/api/overtime/summary?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error generating report', severity: 'error' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setSnackbar({ open: true, message: 'Error generating report', severity: 'error' });
    }
  };

  const getOvertimeChartData = () => {
    if (!reportData) return [];
    
    return reportData.map(item => ({
      name: `${item.first_name} ${item.last_name}`,
      hours: item.total_hours,
      amount: item.total_amount
    }));
  };

  const getOvertimePieData = () => {
    if (!reportData) return [];
    
    return reportData.map(item => ({
      name: `${item.first_name} ${item.last_name}`,
      value: item.total_amount
    }));
  };

  // Group overtime by employee and calculate total amount
  const getEmployeeOvertimeSummary = () => {
    const employeeOvertime = {};
    
    overtimeRecords.forEach(record => {
      const employeeKey = record.employee_id;
      if (!employeeOvertime[employeeKey]) {
        employeeOvertime[employeeKey] = {
          employee_id: record.employee_id,
          employee_code: record.employee_code,
          first_name: record.employee_first_name || record.first_name,
          last_name: record.employee_last_name || record.last_name,
          total_hours: 0,
          total_amount: 0,
          overtime_count: 0
        };
      }
      
      employeeOvertime[employeeKey].total_hours += parseFloat(record.hours || 0);
      employeeOvertime[employeeKey].total_amount += parseFloat(record.total_amount || 0);
      employeeOvertime[employeeKey].overtime_count += 1;
    });
    
    return Object.values(employeeOvertime);
  };

  const filteredOvertimeRecords = overtimeRecords.filter(record => 
    filterEmployee === '' || 
    record.employee_first_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    record.employee_last_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    record.employee_code?.toLowerCase().includes(filterEmployee.toLowerCase())
  );

  const filteredEmployeeOvertime = getEmployeeOvertimeSummary().filter(emp =>
    emp.first_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    emp.last_name?.toLowerCase().includes(filterEmployee.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(filterEmployee.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Overtime Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ReportIcon />}
          onClick={() => setOpenReportDialog(true)}
        >
          Generate Report
        </Button>
      </Box>

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
                {editingOvertime ? 'Edit Overtime' : 'Add New Overtime'}
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
                      label="Date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Hours"
                      type="number"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      required
                      inputProps={{ min: 0.1, max: 24, step: 0.1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Rate (₹/hour)"
                      type="number"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      required
                      inputProps={{ min: 0, step: 0.01 }}
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
                    {editingOvertime ? 'Update Overtime' : 'Add Overtime'}
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
              Overtime Records - Employee Summary
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : filteredEmployeeOvertime.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">
                  No overtime records found
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Total Hours</TableCell>
                    <TableCell>Total Amount (₹)</TableCell>
                    <TableCell>No. of Records</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployeeOvertime.map((empOvertime) => (
                    <TableRow key={empOvertime.employee_id}>
                      <TableCell>{empOvertime.employee_code}</TableCell>
                      <TableCell>{empOvertime.first_name} {empOvertime.last_name}</TableCell>
                      <TableCell>{empOvertime.total_hours.toFixed(1)}</TableCell>
                      <TableCell>₹{empOvertime.total_amount.toLocaleString()}</TableCell>
                      <TableCell>{empOvertime.overtime_count}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: empOvertime.total_amount > 0 ? 'success.main' : 'text.secondary',
                              fontWeight: 'bold'
                            }}
                          >
                            {empOvertime.total_amount > 0 ? 'Active' : 'No Overtime'}
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
              Overtime History
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : filteredOvertimeRecords.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary">
                  No overtime history found
                </Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Rate (₹/hour)</TableCell>
                    <TableCell>Amount (₹)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOvertimeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.first_name && record.last_name 
                          ? `${record.first_name} ${record.last_name}` 
                          : record.employee_code || 'Unknown Employee'
                        }
                      </TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.hours}</TableCell>
                      <TableCell>₹{parseFloat(record.rate_multiplier).toFixed(2)}</TableCell>
                      <TableCell>₹{parseFloat(record.total_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: record.approved_at ? 'success.main' : 'warning.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {record.approved_at ? 'Approved' : 'Pending'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEdit(record)}
                          sx={{ mr: 1 }}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(record.id)}
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

      {/* Report Dialog */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Overtime Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={reportForm.start_date}
                onChange={(e) => setReportForm(prev => ({ ...prev, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={reportForm.end_date}
                onChange={(e) => setReportForm(prev => ({ ...prev, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Employee (Optional)</InputLabel>
                <Select
                  value={reportForm.employee_id}
                  onChange={(e) => setReportForm(prev => ({ ...prev, employee_id: e.target.value }))}
                  label="Employee (Optional)"
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Button variant="contained" onClick={handleGenerateReport} sx={{ mb: 3 }}>
            Generate Report
          </Button>

          {reportData && (
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AccessTimeIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {reportData.reduce((sum, item) => sum + item.total_hours, 0).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Hours
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ backgroundColor: '#e8f5e8', borderLeft: '4px solid #4caf50' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <MoneyIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        ₹{reportData.reduce((sum, item) => sum + item.total_amount, 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {reportData.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Employees
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ backgroundColor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AccessTimeIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {(reportData.reduce((sum, item) => sum + item.total_hours, 0) / reportData.length).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Hours/Employee
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Overtime Summary Table */}
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell align="center">Total Hours</TableCell>
                      <TableCell align="center">Total Amount</TableCell>
                      <TableCell align="center">Records</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.first_name} {item.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.employee_code}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${item.total_hours}h`} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`₹${item.total_amount.toLocaleString()}`} color="success" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.record_count} color="info" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Overtime by Employee
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getOvertimeChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="hours" fill="#0088FE" />
                        <Bar dataKey="amount" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Overtime Amount Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getOvertimePieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getOvertimePieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Overtime;
