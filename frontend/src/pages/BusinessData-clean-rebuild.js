import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Psychology as AIIcon,
  Upload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import api from '../config/api';

const BusinessData = () => {
  const [businessData, setBusinessData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiTraining, setAiTraining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [currentData, setCurrentData] = useState({
    name: '',
    type: '',
    description: '',
    context: '',
    tags: '',
    features: '',
    benefits: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/business');
      setBusinessData(response.data);
    } catch (error) {
      console.error('Error fetching business data:', error);
      setError('Failed to fetch business data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (editingId) {
        await api.put(`/api/business/${editingId}`, currentData);
        setSuccess('Business data updated successfully');
      } else {
        await api.post('/api/business', currentData);
        setSuccess('Business data created successfully');
      }
      
      setOpen(false);
      resetForm();
      await fetchBusinessData();
    } catch (error) {
      console.error('Error saving business data:', error);
      setError(error.response?.data?.message || 'Failed to save business data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainAI = async (dataId) => {
    try {
      setAiTraining(true);
      setError('');
      
      const response = await api.post('/api/ai/train', {
        businessDataId: dataId,
        type: 'business_context'
      });
      
      setSuccess('AI training completed successfully');
    } catch (error) {
      console.error('Error training AI:', error);
      setError(error.response?.data?.message || 'Failed to train AI');
    } finally {
      setAiTraining(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this business data?')) {
      try {
        setLoading(true);
        await api.delete(`/api/business/${id}`);
        setSuccess('Business data deleted successfully');
        await fetchBusinessData();
      } catch (error) {
        console.error('Error deleting business data:', error);
        setError('Failed to delete business data');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (data) => {
    setCurrentData(data);
    setEditingId(data._id);
    setOpen(true);
  };

  const resetForm = () => {
    setCurrentData({
      name: '',
      type: '',
      description: '',
      context: '',
      tags: '',
      features: '',
      benefits: ''
    });
    setEditingId(null);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Business Data Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Business Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {businessData.map((data) => (
          <Grid item xs={12} md={6} lg={4} key={data._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {data.name}
                </Typography>
                <Chip 
                  label={data.type} 
                  size="small" 
                  color="primary" 
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {data.description}
                </Typography>
                {data.tags && (
                  <Box mt={1}>
                    {data.tags.split(',').map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag.trim()} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(data)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AIIcon />}
                    onClick={() => handleTrainAI(data._id)}
                    disabled={aiTraining}
                    color="secondary"
                  >
                    Train AI
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(data._id)}
                    color="error"
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {businessData.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Business Data Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start by adding your first business data to train the AI system.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Business Data
          </Button>
        </Paper>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Business Data' : 'Add New Business Data'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={currentData.name}
                onChange={(e) => setCurrentData({...currentData, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Type"
                value={currentData.type}
                onChange={(e) => setCurrentData({...currentData, type: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={currentData.description}
                onChange={(e) => setCurrentData({...currentData, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Business Context"
                value={currentData.context}
                onChange={(e) => setCurrentData({...currentData, context: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={currentData.tags}
                onChange={(e) => setCurrentData({...currentData, tags: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Key Features"
                value={currentData.features}
                onChange={(e) => setCurrentData({...currentData, features: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Benefits"
                value={currentData.benefits}
                onChange={(e) => setCurrentData({...currentData, benefits: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!currentData.name || !currentData.type || loading}
          >
            {loading ? <CircularProgress size={20} /> : (editingId ? 'Update' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessData;