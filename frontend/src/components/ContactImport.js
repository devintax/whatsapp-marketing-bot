import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Delete as DeleteIcon,
  ContactPhone as ContactIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const ContactImport = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importSettings, setImportSettings] = useState({
    skipDuplicates: true,
    validatePhones: true,
    updateExisting: false
  });
  const fileInputRef = useRef(null);

  const requiredFields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'phone', label: 'Phone Number', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'tags', label: 'Tags', required: false },
    { key: 'notes', label: 'Notes', required: false }
  ];

  const acceptedFormats = [
    { ext: '.csv', type: 'text/csv', name: 'CSV File' },
    { ext: '.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Excel File' },
    { ext: '.xls', type: 'application/vnd.ms-excel', name: 'Legacy Excel File' }
  ];

  const resetImport = () => {
    setActiveStep(0);
    setFile(null);
    setImporting(false);
    setProgress(0);
    setError('');
    setImportResults(null);
    setPreviewData([]);
    setColumnMapping({});
  };

  const handleFileSelect = async (selectedFile) => {
    try {
      setError('');
      setFile(selectedFile);
      
      // Parse and preview the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.CONTACTS.PREVIEW_IMPORT, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setPreviewData(response.data.preview);
        setActiveStep(1);
      } else {
        setError(response.data.message || 'Failed to parse file');
      }
    } catch (error) {
      console.error('File preview error:', error);
      setError(error.response?.data?.message || 'Failed to parse file');
    }
  };

  const handleColumnMapping = () => {
    // Validate required mappings
    const hasRequiredMappings = requiredFields
      .filter(field => field.required)
      .every(field => columnMapping[field.key]);

    if (!hasRequiredMappings) {
      setError('Please map all required fields (Name and Phone Number)');
      return;
    }

    setError('');
    setActiveStep(2);
  };

  const executeImport = async () => {
    try {
      setImporting(true);
      setProgress(0);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('settings', JSON.stringify(importSettings));

      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.CONTACTS.IMPORT, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        setImportResults(response.data.results);
        setActiveStep(3);
        onSuccess && onSuccess(response.data.results);
      } else {
        setError(response.data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create and download a CSV template
    const headers = requiredFields.map(field => field.label).join(',');
    const sampleData = [
      'John Doe,+1234567890,john@example.com,Acme Corp,vip customer,Great lead from networking event',
      'Jane Smith,+1987654321,jane@example.com,Tech Solutions,prospect,Interested in our services'
    ].join('\n');
    
    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contact_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const steps = [
    {
      label: 'Upload File',
      content: (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supported File Formats
              </Typography>
              <List dense>
                {acceptedFormats.map((format, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ContactIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={format.name}
                      secondary={`File extension: ${format.ext}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  sx={{ mr: 2 }}
                >
                  Download Template
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={{
              border: '2px dashed #ccc',
              textAlign: 'center',
              py: 4,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent>
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Contact File
              </Typography>
              <Typography color="textSecondary">
                Click here or drag and drop your file
              </Typography>
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
          />
        </Box>
      )
    },
    {
      label: 'Map Columns',
      content: (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Map your file columns to the required contact fields. Required fields are marked with *.
          </Alert>
          
          {previewData.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Column Mapping
              </Typography>
              {requiredFields.map((field) => (
                <Box key={field.key} sx={{ mb: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>
                      {field.label} {field.required && '*'}
                    </InputLabel>
                    <Select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => setColumnMapping({
                        ...columnMapping,
                        [field.key]: e.target.value
                      })}
                      required={field.required}
                    >
                      <MenuItem value="">-- Skip this field --</MenuItem>
                      {previewData[0] && Object.keys(previewData[0]).map((column) => (
                        <MenuItem key={column} value={column}>
                          {column}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ))}

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Data Preview (First 5 rows)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {previewData[0] && Object.keys(previewData[0]).map((column) => (
                        <TableCell key={column}>{column}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Import Settings',
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>
            Import Configuration
          </Typography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={importSettings.skipDuplicates}
                onChange={(e) => setImportSettings({
                  ...importSettings,
                  skipDuplicates: e.target.checked
                })}
              />
            }
            label="Skip duplicate phone numbers"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={importSettings.validatePhones}
                onChange={(e) => setImportSettings({
                  ...importSettings,
                  validatePhones: e.target.checked
                })}
              />
            }
            label="Validate phone number format"
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={importSettings.updateExisting}
                onChange={(e) => setImportSettings({
                  ...importSettings,
                  updateExisting: e.target.checked
                })}
              />
            }
            label="Update existing contacts"
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            Ready to import {previewData.length} contacts. This action cannot be undone.
          </Alert>

          {importing && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Importing contacts... {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Results',
      content: (
        <Box>
          {importResults && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Import completed successfully!
              </Alert>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Summary
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Total Processed
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {importResults.total}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Successfully Imported
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {importResults.imported}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Skipped (Duplicates)
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {importResults.skipped}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Failed
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {importResults.failed}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {importResults.errors && importResults.errors.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Import Errors
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Error</TableCell>
                          <TableCell>Data</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResults.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.message}</TableCell>
                            <TableCell>{JSON.stringify(error.data)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ContactIcon color="primary" />
          <Typography variant="h6">Import Contacts</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  {step.content}
                </Box>
                <Box sx={{ mb: 2 }}>
                  {index === 0 && file && (
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(1)}
                      sx={{ mr: 1 }}
                    >
                      Continue
                    </Button>
                  )}
                  {index === 1 && (
                    <Button
                      variant="contained"
                      onClick={handleColumnMapping}
                      sx={{ mr: 1 }}
                    >
                      Continue
                    </Button>
                  )}
                  {index === 2 && (
                    <Button
                      variant="contained"
                      onClick={executeImport}
                      disabled={importing}
                      sx={{ mr: 1 }}
                    >
                      {importing ? 'Importing...' : 'Start Import'}
                    </Button>
                  )}
                  {index > 0 && index < 3 && (
                    <Button onClick={() => setActiveStep(index - 1)}>
                      Back
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {activeStep === 3 ? 'Close' : 'Cancel'}
        </Button>
        {activeStep === 3 && (
          <Button onClick={resetImport} variant="outlined">
            Import More
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContactImport;