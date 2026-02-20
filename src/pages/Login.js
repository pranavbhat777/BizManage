import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Container,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 500,
  margin: 'auto',
  boxShadow: theme.shadows[8],
  borderRadius: theme.shape.borderRadius * 2,
}));

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLoginChange = (e) => {
    console.log('handleLoginChange called:', e.target.name, e.target.value);
    setLoginForm(prev => {
      console.log('Previous loginForm:', prev);
      const newForm = {
        ...prev,
        [e.target.name]: e.target.value
      };
      console.log('New loginForm:', newForm);
      return newForm;
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    console.log('Login form submitted:', loginForm);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });
      
      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);
      
      if (response.ok) {
        console.log('Login successful, storing data...');
        login(data.token, data.business);
        setSnackbar({ open: true, message: 'Login successful!', severity: 'success' });
        console.log('About to navigate to /');
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          console.log('Navigating after delay...');
          navigate('/', { replace: true });
        }, 100);
      } else {
        console.log('Login failed:', data.message);
        setSnackbar({ open: true, message: data.message || 'Login failed', severity: 'error' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setSnackbar({ open: true, message: 'Login failed. Please try again.', severity: 'error' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    console.log('Register form submitted:', registerForm);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      console.log('Passwords do not match');
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }
    
    try {
      console.log('Making registration request...');
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: registerForm.name,
          phone: registerForm.phone,
          password: registerForm.password
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        console.log('Registration successful, storing data...');
        login(data.token, data.business);
        setSnackbar({ open: true, message: 'Registration successful!', severity: 'success' });
        console.log('About to navigate to /');
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          console.log('Navigating after delay...');
          navigate('/', { replace: true });
        }, 100);
      } else {
        console.log('Registration failed:', data);
        // Handle validation errors array
        if (data.errors && data.errors.length > 0) {
          const errorMessage = data.errors.map(err => err.msg).join(', ');
          setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } else {
          setSnackbar({ open: true, message: data.message || 'Registration failed', severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSnackbar({ open: true, message: 'Registration failed. Please try again.', severity: 'error' });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2
        }}
      >
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <BusinessIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                BizManage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete Business Management Solution
              </Typography>
            </Box>

            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Login" />
                <Tab label="Register" />
              </Tabs>
            </Paper>

            {tabValue === 0 ? (
              // Login Form
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={loginForm.phone}
                  onChange={handleLoginChange}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  Login
                </Button>
              </Box>
            ) : (
              // Register Form
              <Box component="form" onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Business Name"
                  name="name"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  Register
                </Button>
              </Box>
            )}
          </CardContent>
        </StyledCard>
      </Box>

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
    </Container>
  );
};

export default Login;
