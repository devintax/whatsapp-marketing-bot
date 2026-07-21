import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import ContactImport from '../components/ContactImport';
import CRMIntegrations from '../components/CRMIntegrations';
import { formatPhoneInput, validatePhone, getPhoneExample } from '../utils/phoneFormatter';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openCRMDialog, setOpenCRMDialog] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  // 🏷️ Tag autocomplete enhancement
  const [availableTags, setAvailableTags] = useState([]);
  const [tagCounts, setTagCounts] = useState({});
  
  // 📞 ENHANCED: Phone validation state
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Request all contacts with a high limit to ensure we get everything
      const response = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          limit: 1000 // Request up to 1000 contacts to ensure we get all of them
        }
      });
      // Log the raw API response for debugging
      console.log('Contacts API response:', response.data);
      console.log('Contacts API response.contacts:', response.data.contacts);
      console.log('Contacts API response type:', typeof response.data.contacts);
      // Robust mapping: ensure phoneNumber and tags are always present and correct
      const mappedContacts = (response.data.contacts || []).map(contact => ({
        ...contact,
        phoneNumber: contact.phone || contact.phoneNumber || '',
        tags: Array.isArray(contact.tags)
          ? contact.tags
          : (typeof contact.tags === 'string' ? contact.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      }));
      setContacts(mappedContacts);
      // Log mapped contacts for debugging
      console.log('Mapped contacts:', mappedContacts);
      console.log('Total contacts loaded:', mappedContacts.length);
      console.log('Total contacts available from API:', response.data.total);
    } catch (error) {
      setError('Failed to fetch contacts');
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🏷️ Fetch all existing tags from contacts for autocomplete
  const fetchExistingTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      
      const contacts = response.data.contacts || [];
      const counts = {};
      
      contacts.forEach(contact => {
        if (contact.tags && Array.isArray(contact.tags)) {
          contact.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        }
      });
      
      setAvailableTags(Object.keys(counts).sort());
      setTagCounts(counts);
      console.log('🏷️ Loaded tags for autocomplete:', Object.keys(counts).length, 'unique tags');
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchExistingTags(); // Fetch tags on mount
  }, []);


  const handleCreateContact = () => {
    setCurrentContact(null);
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      tags: '',
      notes: ''
    });
    setPhoneError('');
    setEmailError('');
    setOpenDialog(true);
  };

  const handleEditContact = (contact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name || '',
      phoneNumber: contact.phone || '', // Fix: Map phone to phoneNumber
      email: contact.email || '',
      tags: contact.tags ? contact.tags.join(', ') : '',
      notes: contact.notes || ''
    });
    setPhoneError('');
    setEmailError('');
    setOpenDialog(true);
  };

  // 📞 ENHANCED: Phone number change handler with auto-formatting
  const handlePhoneChange = (e) => {
    const input = e.target.value;
    const formatted = formatPhoneInput(input);
    setFormData({ ...formData, phoneNumber: formatted });
    
    // Real-time validation
    if (input.trim() === '') {
      setPhoneError('');
    } else {
      const validation = validatePhone(input);
      setPhoneError(validation.error || '');
    }
  };

  // 📧 ENHANCED: Email validation
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    // Real-time email validation
    if (email.trim() === '') {
      setEmailError('');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleImportSuccess = (results) => {
    setSuccess(`Successfully imported ${results.imported} contacts!`);
    setOpenImportDialog(false);
    fetchContacts(); // Refresh the contacts list
    fetchExistingTags(); // 🏷️ Refresh tags after import
  };

  const handleCRMSuccess = () => {
    setSuccess('CRM integration configured successfully!');
    setOpenCRMDialog(false);
    fetchContacts(); // Refresh the contacts list
    fetchExistingTags(); // 🏷️ Refresh tags after CRM sync
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(API_ENDPOINTS.CONTACTS.DELETE(contactId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Contact deleted successfully');
      fetchContacts();
      fetchExistingTags(); // 🏷️ Refresh tags after delete
    } catch (error) {
      setError('Failed to delete contact');
    }
  };

  const handleSaveContact = async () => {
    try {
      // 📞 ENHANCED: Validate before saving
      const phoneValidation = validatePhone(formData.phoneNumber);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error);
        setError('Please fix the phone number error before saving');
        return;
      }
      
      if (!formData.name || formData.name.trim() === '') {
        setError('Contact name is required');
        return;
      }
      
      setLoading(true);
      setError(''); // Clear any previous errors
      setSuccess(''); // Clear any previous success messages
      
      const token = localStorage.getItem('token');
      
      const contactData = {
        name: formData.name.trim(),
        phone: formData.phoneNumber.trim(), // Fix: Map phoneNumber to phone
        email: formData.email.trim(),
        notes: formData.notes.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      console.log('💾 Saving contact data:', contactData);
      
      let response;
      if (currentContact) {
        response = await axios.put(API_ENDPOINTS.CONTACTS.UPDATE(currentContact._id), contactData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Contact updated successfully!');
      } else {
        response = await axios.post(API_ENDPOINTS.CONTACTS.CREATE, contactData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ Contact created successfully!');
      }
      
      console.log('✅ Contact save response:', response.data);
      
      setOpenDialog(false);
      setPhoneError('');
      setEmailError('');
      fetchContacts();
      fetchExistingTags(); // 🏷️ Refresh tags after save
    } catch (error) {
      console.error('❌ Contact save error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // 📞 ENHANCED: Better error messages
      let errorMessage = 'Failed to save contact';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        const validationErrors = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.map(err => err.msg || err.message).join(', ')
          : 'Validation failed';
        errorMessage = `Validation Error: ${validationErrors}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumber?.includes(searchTerm) ||
    contact.phone?.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(contact.tags) && contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const getContactInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const ContactCard = ({ contact }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {getContactInitials(contact.name)}
          </Avatar>
          <Box>
            <Typography variant="h6">{contact.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {contact.phoneNumber || contact.phone}
            </Typography>
          </Box>
        </Box>
        
        {contact.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">{contact.email}</Typography>
          </Box>
        )}
        
        {contact.tags && contact.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {contact.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title="Edit Contact">
            <IconButton onClick={() => handleEditContact(contact)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Contact">
            <IconButton 
              color="error" 
              onClick={() => handleDeleteContact(contact._id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ mr: 2 }} />
            Contact Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setOpenImportDialog(true)}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => setOpenCRMDialog(true)}
            >
              CRM Sync
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateContact}
              size="large"
            >
              Add Contact
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Debug: Show mapped contacts in console */}
        {process.env.NODE_ENV !== 'production' && (
          <pre style={{ display: 'none' }}>{JSON.stringify(contacts, null, 2)}</pre>
        )}

        {/* Show empty state if no contacts */}
        {filteredContacts.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No contacts found' : 'No contacts yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Add your first contact to get started'
              }
            </Typography>
            {!searchTerm && (
              <Button variant="contained" onClick={handleCreateContact}>
                Add First Contact
              </Button>
            )}
          </Box>
        )}

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
            sx={{ width: 300 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'cards'}
                onChange={(e) => setViewMode(e.target.checked ? 'cards' : 'table')}
              />
            }
            label="Card View"
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'cards' ? (
          <Grid container spacing={3}>
            {filteredContacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact._id}>
                <ContactCard contact={contact} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {getContactInitials(contact.name)}
                        </Avatar>
                        {contact.name}
                      </Box>
                    </TableCell>
                    <TableCell>{contact.phoneNumber || contact.phone}</TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>
                      {contact.tags && contact.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditContact(contact)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteContact(contact._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredContacts.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No contacts found' : 'No contacts yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Add your first contact to get started'
              }
            </Typography>
            {!searchTerm && (
              <Button variant="contained" onClick={handleCreateContact}>
                Add First Contact
              </Button>
            )}
          </Box>
        )}

        {/* Create/Edit Contact Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {currentContact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  required
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder={getPhoneExample()}
                  required
                  error={Boolean(phoneError)}
                  helperText={phoneError || 'Phone number will be auto-formatted as you type'}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: phoneError ? 'error.main' : 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="contact@example.com"
                  error={Boolean(emailError)}
                  helperText={emailError || 'Optional - used for email campaigns'}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: emailError ? 'error.main' : 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={availableTags}
                  value={formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []}
                  onChange={(e, newValue) => {
                    setFormData({ ...formData, tags: newValue.join(', ') });
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        size="small"
                        color="primary"
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span>{option}</span>
                        <Chip 
                          label={`${tagCounts[option] || 0} contact${(tagCounts[option] || 0) !== 1 ? 's' : ''}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Start typing or select existing tags..."
                      helperText="Select from existing tags or type to create new ones - press Enter to add"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                  placeholder="Add any additional notes about this contact..."
                  helperText={`${formData.notes.length} characters`}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setPhoneError('');
              setEmailError('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContact} 
              variant="contained"
              disabled={loading || !formData.name || !formData.phoneNumber || Boolean(phoneError)}
            >
              {loading ? <CircularProgress size={20} /> : (currentContact ? 'Update Contact' : 'Add Contact')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Contact Import Dialog */}
        <ContactImport
          open={openImportDialog}
          onClose={() => setOpenImportDialog(false)}
          onSuccess={handleImportSuccess}
        />

        {/* CRM Integrations Dialog */}
        <CRMIntegrations
          open={openCRMDialog}
          onClose={() => setOpenCRMDialog(false)}
          onSuccess={handleCRMSuccess}
        />
      </Box>
    </Container>
  );
}