import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Avatar,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  PhotoCamera,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePicture: '',
    businessName: '',
    businessIndustry: 'other',
    businessPhone: '',
    businessEmail: '',
    businessAddress: '',
    businessWebsite: '',
    businessLogo: '',
    businessDescription: '',
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    notifications: {
      email: true,
      whatsapp: false,
      campaignUpdates: true,
      contactImports: true,
      weeklyReports: true
    },
    aiPreferences: {
      preferredProvider: 'groq',
      defaultTone: 'professional',
      autoTrainContext: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.PROFILE.GET, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = response.data.profile;
        
        // Map backend structure to frontend structure
        const mappedProfile = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profilePicture: userData.profilePicture || '',
          
          // Map businessProfile nested object to flat structure
          businessName: userData.businessProfile?.businessName || '',
          businessIndustry: userData.businessProfile?.industry || 'other',
          businessPhone: userData.businessProfile?.phone || '',
          businessEmail: userData.businessProfile?.email || '',
          businessWebsite: userData.businessProfile?.website || '',
          businessAddress: userData.businessProfile?.address || '',
          businessLogo: userData.businessProfile?.logo || '',
          businessDescription: userData.businessProfile?.description || '',
          
          // Map preferences
          timezone: userData.preferences?.timezone || 'America/New_York',
          language: userData.preferences?.language || 'en',
          dateFormat: userData.preferences?.dateFormat || 'MM/DD/YYYY',
          timeFormat: userData.preferences?.timeFormat || '12h',
          
          // Map notifications
          notifications: userData.notifications || {
            email: true,
            whatsapp: false,
            campaignUpdates: true,
            contactImports: true,
            weeklyReports: true
          },
          
          // Map AI preferences
          aiPreferences: userData.aiPreferences || {
            preferredProvider: 'groq',
            defaultTone: 'professional',
            autoTrainContext: true
          },
          
          // Meta fields
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          subscription: userData.subscription
        };
        
        setProfile(mappedProfile);
        
        // Set image previews with proper URL construction
        if (userData.profilePicture) {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          // Ensure single slash between URL and path
          const picturePath = userData.profilePicture.startsWith('/') 
            ? userData.profilePicture.substring(1)  // Remove leading slash
            : userData.profilePicture;
          setAvatarPreview(`${apiUrl}/${picturePath}`);
        }
        
        if (userData.businessProfile?.logo) {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          // Ensure single slash between URL and path
          const logoPath = userData.businessProfile.logo.startsWith('/') 
            ? userData.businessProfile.logo.substring(1)  // Remove leading slash
            : userData.businessProfile.logo;
          setLogoPreview(`${apiUrl}/${logoPath}`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleNestedChange = (parent, field, value) => {
    setProfile({
      ...profile,
      [parent]: {
        ...profile[parent],
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Map frontend flat structure back to backend nested structure
      const backendPayload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        
        // Map flat business fields to nested businessProfile object
        businessProfile: {
          businessName: profile.businessName,
          industry: profile.businessIndustry, // Note: backend uses 'industry', not 'businessIndustry'
          phone: profile.businessPhone,
          email: profile.businessEmail,
          website: profile.businessWebsite,
          address: profile.businessAddress,
          description: profile.businessDescription
          // logo is handled separately via upload endpoint
        },
        
        // Map preferences
        preferences: {
          timezone: profile.timezone,
          language: profile.language,
          dateFormat: profile.dateFormat,
          timeFormat: profile.timeFormat
        },
        
        // Map notifications
        notifications: profile.notifications,
        
        // Map AI preferences
        aiPreferences: profile.aiPreferences
      };
      
      const response = await axios.put(
        API_ENDPOINTS.PROFILE.UPDATE,
        backendPayload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        // Refresh profile to get updated data from server
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        API_ENDPOINTS.PROFILE.UPLOAD_AVATAR,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        const picturePath = response.data.profilePicture.startsWith('/') 
          ? response.data.profilePicture.substring(1)  // Remove leading slash
          : response.data.profilePicture;
        
        setProfile({ ...profile, profilePicture: response.data.profilePicture });
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        setAvatarPreview(`${apiUrl}/${picturePath}`);
        
        toast.success('Profile picture updated!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        API_ENDPOINTS.PROFILE.UPLOAD_LOGO,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Update profile state
        setProfile({ ...profile, businessLogo: response.data.businessLogo });
        
        // Construct preview URL properly (avoid double slashes)
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const logoPath = response.data.businessLogo.startsWith('/') 
          ? response.data.businessLogo.substring(1)  // Remove leading slash
          : response.data.businessLogo;
        setLogoPreview(`${apiUrl}/${logoPath}`);
        
        toast.success('Business logo updated!');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload business logo');
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        API_ENDPOINTS.PROFILE.CHANGE_PASSWORD,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<PersonIcon />} label="Personal Info" />
            <Tab icon={<BusinessIcon />} label="Business Info" />
            <Tab icon={<SettingsIcon />} label="Settings" />
            <Tab icon={<SecurityIcon />} label="Security" />
          </Tabs>
        </Box>

        {/* Tab 1: Personal Info */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} display="flex" justifyContent="center">
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={avatarPreview}
                  sx={{ width: 120, height: 120 }}
                >
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profile.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profile.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Personal Info'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Business Info */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} display="flex" justifyContent="center">
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={logoPreview}
                  variant="rounded"
                  sx={{ width: 120, height: 120 }}
                >
                  {profile.businessName?.[0]}
                </Avatar>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <IconButton
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Name"
                value={profile.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                required
                helperText="This will be used in campaigns and AI-generated content"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={profile.businessIndustry}
                  onChange={(e) => handleChange('businessIndustry', e.target.value)}
                  label="Industry"
                >
                  <MenuItem value="financial">Financial Services</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="real_estate">Real Estate</MenuItem>
                  <MenuItem value="hospitality">Hospitality</MenuItem>
                  <MenuItem value="manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="consulting">Consulting</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Phone"
                value={profile.businessPhone}
                onChange={(e) => handleChange('businessPhone', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Email"
                value={profile.businessEmail}
                onChange={(e) => handleChange('businessEmail', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={profile.businessWebsite}
                onChange={(e) => handleChange('businessWebsite', e.target.value)}
                placeholder="https://example.com"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Address"
                value={profile.businessAddress}
                onChange={(e) => handleChange('businessAddress', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Description"
                value={profile.businessDescription}
                onChange={(e) => handleChange('businessDescription', e.target.value)}
                multiline
                rows={4}
                helperText="This helps AI generate better campaign content. Describe what your business does, your unique value proposition, and your target audience."
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Business Info'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Settings */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Regional Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={profile.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  label="Timezone"
                >
                  <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                  <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                  <MenuItem value="Europe/London">London (GMT)</MenuItem>
                  <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                  <MenuItem value="Australia/Sydney">Sydney (AEST)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={profile.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                  <MenuItem value="it">Italian</MenuItem>
                  <MenuItem value="pt">Portuguese</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select
                  value={profile.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  label="Date Format"
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Time Format</InputLabel>
                <Select
                  value={profile.timeFormat}
                  onChange={(e) => handleChange('timeFormat', e.target.value)}
                  label="Time Format"
                >
                  <MenuItem value="12h">12 Hour (AM/PM)</MenuItem>
                  <MenuItem value="24h">24 Hour</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Notifications
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.notifications.email}
                      onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.notifications.whatsapp}
                      onChange={(e) => handleNestedChange('notifications', 'whatsapp', e.target.checked)}
                    />
                  }
                  label="WhatsApp Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.notifications.campaignUpdates}
                      onChange={(e) => handleNestedChange('notifications', 'campaignUpdates', e.target.checked)}
                    />
                  }
                  label="Campaign Updates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.notifications.contactImports}
                      onChange={(e) => handleNestedChange('notifications', 'contactImports', e.target.checked)}
                    />
                  }
                  label="Contact Import Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.notifications.weeklyReports}
                      onChange={(e) => handleNestedChange('notifications', 'weeklyReports', e.target.checked)}
                    />
                  }
                  label="Weekly Reports"
                />
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                AI Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred AI Provider</InputLabel>
                <Select
                  value={profile.aiPreferences.preferredProvider}
                  onChange={(e) => handleNestedChange('aiPreferences', 'preferredProvider', e.target.value)}
                  label="Preferred AI Provider"
                >
                  <MenuItem value="groq">Groq (Fast & Reliable)</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="gemini">Google Gemini</MenuItem>
                  <MenuItem value="claude">Claude</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Tone</InputLabel>
                <Select
                  value={profile.aiPreferences.defaultTone}
                  onChange={(e) => handleNestedChange('aiPreferences', 'defaultTone', e.target.value)}
                  label="Default Tone"
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="friendly">Friendly</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.aiPreferences.autoTrainContext}
                      onChange={(e) => handleNestedChange('aiPreferences', 'autoTrainContext', e.target.checked)}
                    />
                  }
                  label="Automatically use business context in AI generation"
                />
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Security */}
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                helperText="Password must be at least 6 characters"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePasswordChange}
              >
                Change Password
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Account Created:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Last Login:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Subscription Plan:</strong> {profile.subscription?.plan || 'Free'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
}
