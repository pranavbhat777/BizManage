import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Assessment as ReportIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  RemoveCircle as HalfDayIcon,
  HelpOutline as NotMarkedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
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

const AttendanceCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

const Attendance = () => {
  const { token } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    date: selectedDate,
    attendance: []
  });

  const [reportForm, setReportForm] = useState({
    start_date: '',
    end_date: '',
    employee_id: ''
  });

  const fetchEmployees = useCallback(async () => {
    try {
      console.log('Fetching employees for attendance...');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Employees response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Employees data:', data);
        setEmployees(data);
        
        // Initialize attendance data for all employees
        setFormData(prev => ({
          ...prev,
          attendance: data.map(emp => ({
            employee_id: emp.id,
            status: 'present',
            notes: ''
          }))
        }));
      } else {
        console.error('Failed to fetch employees:', response.status);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAttendance = useCallback(async () => {
    try {
      console.log('Fetching attendance for date:', selectedDate);
      const response = await fetch(`http://localhost:5000/api/attendance?start_date=${selectedDate}&end_date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Attendance response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Attendance data:', data);
        setAttendance(data);
      } else {
        console.error('Failed to fetch attendance:', response.status);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [fetchEmployees, fetchAttendance]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAttendanceChange = (employeeId, field, value) => {
    setFormData(prev => ({
      ...prev,
      attendance: prev.attendance.map(item => 
        item.employee_id === employeeId 
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSnackbar({ open: true, message: 'Attendance marked successfully', severity: 'success' });
        handleCloseDialog();
        fetchAttendance();
      } else {
        const error = await response.json();
        setSnackbar({ open: true, message: error.message || 'Error marking attendance', severity: 'error' });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setSnackbar({ open: true, message: 'Error marking attendance', severity: 'error' });
    }
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
      
      const response = await fetch(`http://localhost:5000/api/attendance/summary?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Report data received:', data); // Debug log
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <PresentIcon sx={{ color: '#00C49F' }} />;
      case 'absent':
        return <AbsentIcon sx={{ color: '#FF8042' }} />;
      case 'half_day':
        return <HalfDayIcon sx={{ color: '#FFBB28' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'half_day': return 'warning';
      default: return 'default';
    }
  };

  const getAttendanceChartData = () => {
    if (!reportData) return [];
    
    return reportData.map(item => ({
      name: `${item.first_name} ${item.last_name}`,
      present: item.present_days,
      absent: item.absent_days,
      half_day: item.half_days,
      percentage: item.attendance_percentage
    }));
  };

  const getAttendancePieData = () => {
    if (!reportData) return [];
    
    const totals = reportData.reduce((acc, item) => {
      acc.present += item.present_days;
      acc.absent += item.absent_days;
      acc.half_day += item.half_days;
      acc.not_marked_days += (item.total_days || 7) - (item.present_days + item.absent_days + item.half_days);
      return acc;
    }, { present: 0, absent: 0, half_day: 0, not_marked_days: 0 });
    
    return [
      { name: 'Present', value: totals.present, color: '#4caf50' },
      { name: 'Absent', value: totals.absent, color: '#f44336' },
      { name: 'Half Day', value: totals.half_day, color: '#ff9800' },
      { name: 'Not Marked', value: totals.not_marked_days, color: '#9e9e9e' }
    ];
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
          Attendance Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            label="Date"
          />
          <Button
            variant="contained"
            startIcon={<CalendarIcon />}
            onClick={handleOpenDialog}
          >
            Mark Attendance
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={() => setOpenReportDialog(true)}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Today's Attendance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <AttendanceCard elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PresentIcon sx={{ fontSize: 40, color: '#00C49F', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#00C49F', fontWeight: 'bold' }}>
                {attendance.filter(a => a.status === 'present').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Present Today
              </Typography>
            </CardContent>
          </AttendanceCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <AttendanceCard elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AbsentIcon sx={{ fontSize: 40, color: '#FF8042', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#FF8042', fontWeight: 'bold' }}>
                {attendance.filter(a => a.status === 'absent').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Absent Today
              </Typography>
            </CardContent>
          </AttendanceCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <AttendanceCard elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HalfDayIcon sx={{ fontSize: 40, color: '#FFBB28', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#FFBB28', fontWeight: 'bold' }}>
                {attendance.filter(a => a.status === 'half_day').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Half Day Today
              </Typography>
            </CardContent>
          </AttendanceCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <AttendanceCard elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <NotMarkedIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {employees.length - attendance.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Not Marked
              </Typography>
            </CardContent>
          </AttendanceCard>
        </Grid>
      </Grid>

      {/* Attendance Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Employee Code</StyledTableCell>
              <StyledTableCell>Name</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Notes</StyledTableCell>
              <StyledTableCell>Marked At</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendance.map((record) => (
              <StyledTableRow key={record.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {record.employee_code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {record.first_name} {record.last_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(record.status)}
                    <Chip
                      label={record.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(record.status)}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{record.notes || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(record.marked_at).toLocaleString()}
                  </Typography>
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mark Attendance Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Mark Attendance for {selectedDate}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.attendance.map((item) => {
                    const employee = employees.find(emp => emp.id === item.employee_id);
                    return (
                      <TableRow key={item.employee_id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {employee?.employee_code}
                          </Typography>
                          <Typography variant="caption">
                            {employee?.first_name} {employee?.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ToggleButtonGroup
                            value={item.status}
                            exclusive
                            onChange={(e, value) => value && handleAttendanceChange(item.employee_id, 'status', value)}
                            size="small"
                          >
                            <ToggleButton value="present" color="success">
                              Present
                            </ToggleButton>
                            <ToggleButton value="absent" color="error">
                              Absent
                            </ToggleButton>
                            <ToggleButton value="half_day" color="warning">
                              Half Day
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Add notes..."
                            value={item.notes}
                            onChange={(e) => handleAttendanceChange(item.employee_id, 'notes', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Mark Attendance
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Attendance Report</DialogTitle>
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
              {/* Attendance Summary Table */}
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell align="center">Present</TableCell>
                      <TableCell align="center">Absent</TableCell>
                      <TableCell align="center">Half Day</TableCell>
                      <TableCell align="center">Working Days</TableCell>
                      <TableCell align="center">Attendance %</TableCell>
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
                          <Chip label={item.present_days} color="success" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.absent_days} color="error" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.half_days} color="warning" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.working_days || 0} color="info" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.attendance_percentage}%
                          </Typography>
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
                      Attendance by Employee
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getAttendanceChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="present" fill="#00C49F" />
                        <Bar dataKey="absent" fill="#FF8042" />
                        <Bar dataKey="half_day" fill="#FFBB28" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Overall Attendance Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getAttendancePieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getAttendancePieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
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

export default Attendance;
