import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 600,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const Employees = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    join_date: '',
    position: '',
    department: '',
    salary_type: 'monthly',
    salary_amount: '',
    bank_account: '',
    bank_name: '',
    employee_code: ''
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({ open: true, message: 'Error fetching employees', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        phone: employee.phone || '',
        address: employee.address || '',
        join_date: employee.join_date || '',
        position: employee.position || '',
        department: employee.department || '',
        salary_type: employee.salary_type,
        salary_amount: employee.salary_amount,
        bank_account: employee.bank_account || '',
        bank_name: employee.bank_name || '',
        employee_code: employee.employee_code || ''
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        join_date: '',
        position: '',
        department: '',
        salary_type: 'monthly',
        salary_amount: '',
        bank_account: '',
        bank_name: '',
        employee_code: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      join_date: '',
      position: '',
      department: '',
      salary_type: 'monthly',
      salary_amount: '',
      bank_account: '',
      bank_name: '',
      employee_code: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Token found:', !!token);
      
      const url = editingEmployee 
        ? `http://localhost:5000/api/employees/${editingEmployee.id}`
        : 'http://localhost:5000/api/employees';
      
      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const message = editingEmployee ? 'Employee updated successfully' : 'Employee added successfully';
        setSnackbar({ open: true, message, severity: 'success' });
        handleCloseDialog();
        fetchEmployees();
      } else {
        const error = await response.json();
        console.log('Error response:', error);
        // Handle validation errors array
        if (error.errors && error.errors.length > 0) {
          const errorMessage = error.errors.map(err => err.msg).join(', ');
          setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } else {
          setSnackbar({ open: true, message: error.message || 'Error saving employee', severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      setSnackbar({ open: true, message: 'Error saving employee', severity: 'error' });
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Employee deleted successfully', severity: 'success' });
        fetchEmployees();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error deleting employee', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      setSnackbar({ open: true, message: 'Error deleting employee', severity: 'error' });
    }
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSalaryTypeColor = (type) => {
    switch (type) {
      case 'daily': return 'warning';
      case 'weekly': return 'info';
      case 'monthly': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
          Employee Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Employee Code</StyledTableCell>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell>Phone</StyledTableCell>
              <StyledTableCell>Position</StyledTableCell>
              <StyledTableCell>Salary</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <StyledTableRow key={employee.id}>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.75rem',
                      fontWeight: 400,
                      color: 'text.secondary'
                    }}
                  >
                    {employee.employee_code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'text.primary'
                    }}
                  >
                    {employee.first_name} {employee.last_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {employee.phone || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {employee.position || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{employee.salary_amount.toLocaleString()}
                    </Typography>
                    <Chip
                      label={employee.salary_type}
                      size="small"
                      color={getSalaryTypeColor(employee.salary_type)}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(employee)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(employee.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee Code (Optional)"
                  name="employee_code"
                  value={formData.employee_code || ''}
                  onChange={handleInputChange}
                  helperText="Leave empty to auto-generate"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Joining"
                  name="join_date"
                  type="date"
                  value={formData.join_date}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Salary Type</InputLabel>
                  <Select
                    name="salary_type"
                    value={formData.salary_type}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Salary Amount"
                  name="salary_amount"
                  type="number"
                  value={formData.salary_amount}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Bank Account"
                  name="bank_account"
                  value={formData.bank_account}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingEmployee ? 'Update' : 'Add'} Employee
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Employees;
