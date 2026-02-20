import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Grid, Paper, Typography, CircularProgress, Fab, Zoom } from '@mui/material';
import {
  People as PeopleIcon,
  EventAvailable as EventAvailableIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const StatCard = styled(Paper)(({ theme }) => ({
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

const ActivityCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '300px',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from context (will be mock)
  
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    todayAttendance: { present: 0, absent: 0, half_day: 0, late: 0 },
    weeklyPayroll: { totalAmount: 0, pendingAmount: 0, paidAmount: 0 },
    monthlyPayroll: { totalAmount: 0, pendingAmount: 0, paidAmount: 0 },
    totalAdvances: 0,
    pendingAdvances: 0,
    lowStockItems: 0,
    totalProducts: 0,
    totalValueProduced: 0,
    totalValuePurchased: 0,
    totalValueSold: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real dashboard data from APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees data
      const employeesResponse = await fetch('http://localhost:5000/api/employees');
      const employees = await employeesResponse.json();
      
      // Fetch attendance data
      const attendanceResponse = await fetch('http://localhost:5000/api/attendance');
      const attendanceData = await attendanceResponse.json();
      
      // Fetch payroll data
      const payrollResponse = await fetch('http://localhost:5000/api/payroll');
      const payrollData = await payrollResponse.json();
      
      // Fetch advances data
      const advancesResponse = await fetch('http://localhost:5000/api/advances');
      const advancesData = await advancesResponse.json();
      
      // Calculate real dashboard metrics
      const totalEmployees = employees.length;
      const todayAttendance = calculateTodayAttendance(attendanceData);
      const totalAdvances = calculateTotalAdvances(advancesData);
      const pendingAdvances = calculatePendingAdvances(advancesData);
      const weeklyPayroll = calculateWeeklyPayroll(payrollData);
      const monthlyPayroll = calculateMonthlyPayroll(payrollData);
      
      const realDashboardData = {
        totalEmployees,
        todayAttendance,
        weeklyPayroll,
        monthlyPayroll,
        totalAdvances,
        pendingAdvances,
        lowStockItems: 0, // TODO: Fetch from products API
        totalProducts: 0, // TODO: Fetch from products API
        totalValueProduced: 0, // TODO: Fetch from products API
        totalValuePurchased: 0, // TODO: Fetch from products API
        totalValueSold: 0 // TODO: Fetch from products API
      };
      
      setDashboardData(realDashboardData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Helper functions to calculate real dashboard metrics
  const calculateTodayAttendance = (attendanceData) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceData.filter(record => record.date === today);
    
    return {
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      half_day: todayAttendance.filter(a => a.status === 'half_day').length,
      late: todayAttendance.filter(a => a.status === 'late').length
    };
  };

  const calculateTotalAdvances = (advancesData) => {
    return advancesData.reduce((total, advance) => total + (advance.amount || 0), 0);
  };

  const calculatePendingAdvances = (advancesData) => {
    return advancesData
      .filter(advance => advance.status === 'pending')
      .reduce((total, advance) => total + (advance.amount || 0), 0);
  };

  const calculateWeeklyPayroll = (payrollData) => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyPayroll = payrollData.filter(payroll => new Date(payroll.created_at) >= oneWeekAgo);
    
    const totalAmount = weeklyPayroll.reduce((total, payroll) => total + (payroll.total_amount || 0), 0);
    const pendingAmount = weeklyPayroll
      .filter(payroll => payroll.status === 'pending')
      .reduce((total, payroll) => total + (payroll.total_amount || 0), 0);
    const paidAmount = weeklyPayroll
      .filter(payroll => payroll.status === 'paid')
      .reduce((total, payroll) => total + (payroll.total_amount || 0), 0);
    
    return { totalAmount, pendingAmount, paidAmount };
  };

  const calculateMonthlyPayroll = (payrollData) => {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyPayroll = payrollData.filter(payroll => new Date(payroll.created_at) >= oneMonthAgo);
    
    const totalAmount = monthlyPayroll.reduce((total, payroll) => total + (payroll.total_amount || 0), 0);
    const pendingAmount = monthlyPayroll
      .filter(payroll => payroll.status === 'pending')
      .reduce((total, payroll) => total + (payroll.total_amount || 0), 0);
    const paidAmount = monthlyPayroll
      .filter(payroll => payroll.status === 'paid')
      .reduce((total, payroll) => total + (payroll.total_amount || 0), 0);
    
    return { totalAmount, pendingAmount, paidAmount };
  };

  // Fetch real weekly attendance data
  const fetchWeeklyAttendance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/business/weekly-attendance');
      const data = await response.json();
      setWeeklyAttendance(data.employees || []);
    } catch (error) {
      console.error('Error fetching weekly attendance:', error);
      setWeeklyAttendance([]);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    // Fetch real data from APIs
    await Promise.all([fetchDashboardData(), fetchWeeklyAttendance()]);
    setRefreshing(false);
  };

  useEffect(() => {
    // Load real data on component mount
    fetchDashboardData();
    fetchWeeklyAttendance();
  }, []);

  // Prepare data for charts
  const prepareAttendanceData = () => {
    if (!dashboardData || !dashboardData.todayAttendance) return [];
    
    const attendance = dashboardData.todayAttendance;
    return [
      { name: 'Present', value: attendance.present || 0, color: '#00C49F' },
      { name: 'Absent', value: attendance.absent || 0, color: '#FF8042' },
      { name: 'Half Day', value: attendance.half_day || 0, color: '#FFBB28' },
      { name: 'Not Marked', value: attendance.not_marked || 0, color: '#E0E0E0' }
    ];
  };

  const prepareOvertimeTrendData = () => {
    if (!dashboardData) return [];
    
    // Generate sample overtime trend data for the last 4 weeks
    return [
      { week: 'Week 1', hours: 25, amount: 3750 },
      { week: 'Week 2', hours: 32, amount: 4800 },
      { week: 'Week 3', hours: 28, amount: 4200 },
      { week: 'Week 4', hours: 40, amount: 6000 }
    ];
  };

  const prepareWeeklyAttendanceData = () => {
    if (!dashboardData || !dashboardData.todayAttendance) return [];
    
    // Generate sample weekly attendance data based on today's attendance
    const todayAttendance = dashboardData.todayAttendance;
    const totalEmployees = (todayAttendance.present || 0) + (todayAttendance.absent || 0) + (todayAttendance.half_day || 0) + (todayAttendance.not_marked || 0);
    
    return [
      { week: 'Week 1', present: Math.floor(totalEmployees * 0.85), absent: Math.floor(totalEmployees * 0.10), half_day: Math.floor(totalEmployees * 0.05) },
      { week: 'Week 2', present: Math.floor(totalEmployees * 0.90), absent: Math.floor(totalEmployees * 0.05), half_day: Math.floor(totalEmployees * 0.05) },
      { week: 'Week 3', present: Math.floor(totalEmployees * 0.80), absent: Math.floor(totalEmployees * 0.15), half_day: Math.floor(totalEmployees * 0.05) },
      { week: 'Week 4', present: todayAttendance.present || 0, absent: todayAttendance.absent || 0, half_day: todayAttendance.half_day || 0 }
    ];
  };

  const preparePayrollData = () => {
    if (!dashboardData) return [];
    
    return [
      { month: 'Week 1', amount: dashboardData.weeklyPayroll?.totalAmount || 0 },
      { month: 'Week 2', amount: (dashboardData.weeklyPayroll?.totalAmount || 0) * 0.9 },
      { month: 'Week 3', amount: (dashboardData.weeklyPayroll?.totalAmount || 0) * 1.1 },
      { month: 'Week 4', amount: dashboardData.monthlyPayroll?.totalAmount || 0 }
    ];
  };

  const formatActivityText = (activity) => {
    switch (activity.type) {
      case 'attendance':
        return `Attendance marked for ${activity.employee_name} - ${activity.status}`;
      case 'advance':
        return `Advance of ₹${activity.status} recorded for ${activity.employee_name}`;
      case 'overtime':
        return `Overtime of ${activity.status} recorded for ${activity.employee_name}`;
      case 'payroll':
        return `Payroll ${activity.status} for ${activity.employee_name}`;
      default:
        return activity.notes || 'Unknown activity';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'attendance':
        return <EventAvailableIcon sx={{ color: '#00C49F' }} />;
      case 'advance':
        return <AccountBalanceWalletIcon sx={{ color: '#FF8042' }} />;
      case 'overtime':
        return <TrendingUpIcon sx={{ color: '#0088FE' }} />;
      case 'payroll':
        return <AttachMoneyIcon sx={{ color: '#8884D8' }} />;
      default:
        return <WarningIcon sx={{ color: '#757575' }} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Prepare stats for display
  const stats = dashboardData ? [
    { 
      title: 'Total Employees', 
      value: (dashboardData.totalEmployees || 0).toString(), 
      icon: <PeopleIcon />,
      color: '#1976d2'
    },
    { 
      title: 'Present Today', 
      value: (dashboardData.todayAttendance?.present || 0).toString(), 
      icon: <EventAvailableIcon />,
      color: '#00C49F'
    },
    { 
      title: 'This Month\'s Payroll', 
      value: `₹${(dashboardData.monthlyPayroll?.totalAmount || 0).toLocaleString()}`, 
      icon: <AttachMoneyIcon />,
      color: '#8884D8'
    },
    { 
      title: 'Pending Advances', 
      value: `₹${(dashboardData.pendingAdvances || 0).toLocaleString()}`, 
      icon: <AccountBalanceWalletIcon />,
      color: '#FF8042'
    },
  ] : [];

  return (
    <Box position="relative">
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
        Business Overview Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
              <StatCard elevation={3}>
                {stat.icon}
                <Typography variant="h6">{stat.title}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                  {stat.value}
                </Typography>
              </StatCard>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Attendance Overview Chart */}
        <Grid item xs={12} md={4}>
          <ActivityCard elevation={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Today's Attendance
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={prepareAttendanceData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareAttendanceData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => {
                      const dataItem = prepareAttendanceData().find(item => item.value === value);
                      return dataItem ? `${dataItem.name}: ${value}` : `${value}`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </ActivityCard>
        </Grid>

        {/* Weekly Attendance Report */}
        <Grid item xs={12} md={12}>
          <ActivityCard elevation={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableChartIcon />
              Weekly Attendance Report
            </Typography>
            <Box sx={{ overflow: 'auto', maxHeight: 300 }}>
              {weeklyAttendance.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Employee</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Present</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Absent</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Half Days</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Working Days</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyAttendance.map((employee, index) => (
                      <tr key={employee.employee_id} style={{ borderBottom: '1px solid #eee', '&:hover': { backgroundColor: '#f9f9f9' } }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{employee.employee_name}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#4caf50', fontWeight: '700', fontSize: '18px' }}>{employee.present_days}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#f44336', fontWeight: '700', fontSize: '18px' }}>{employee.absent_days}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ff9800', fontWeight: '700', fontSize: '18px' }}>{employee.half_days}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#2196f3', fontWeight: '700', fontSize: '18px' }}>
                          {employee.working_days || 0}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', fontSize: '18px' }}>
                          <span style={{ 
                            color: employee.attendance_percentage >= 80 ? '#4caf50' : 
                                   employee.attendance_percentage >= 60 ? '#ff9800' : '#f44336' 
                          }}>
                            {employee.attendance_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography>No attendance data for this week</Typography>
                </Box>
              )}
            </Box>
          </ActivityCard>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }} elevation={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[
                { action: 'Mark Attendance', route: '/attendance', color: '#00C49F' },
                { action: 'Add Employee', route: '/employees', color: '#1976d2' },
                { action: 'Record Advance', route: '/advances', color: '#FF8042' },
                { action: 'Generate Payroll', route: '/payroll', color: '#8884D8' },
              ].map((item, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    flex: '1 1 45%',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    borderLeft: `4px solid ${item.color}`,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => navigate(item.route)}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {item.action}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Refresh Button */}
      <Fab
        color="primary"
        aria-label="refresh"
        onClick={handleRefresh}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
      >
        {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
      </Fab>
    </Box>
  );
};

export default Dashboard;
