import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const MediaUpload = ({ onFilesUploaded, maxFiles = 5, acceptedTypes = ['image/*', 'application/pdf'], disabled = false }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  const maxFileSize = 10 * 1024 * 1024; // 10MB limit

  const fileTypeConfig = {
    'image/jpeg': { icon: ImageIcon, label: 'JPEG Image', color: 'primary' },
    'image/jpg': { icon: ImageIcon, label: 'JPG Image', color: 'primary' },
    'image/png': { icon: ImageIcon, label: 'PNG Image', color: 'primary' },
    'image/gif': { icon: ImageIcon, label: 'GIF Image', color: 'secondary' },
    'image/webp': { icon: ImageIcon, label: 'WebP Image', color: 'primary' },
    'application/pdf': { icon: PdfIcon, label: 'PDF Document', color: 'error' },
    'default': { icon: AttachIcon, label: 'File', color: 'default' }
  };

  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File "${file.name}" is too large. Maximum size is 10MB.`);
    }
    
    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });
    
    if (!isValidType) {
      errors.push(`File "${file.name}" type is not supported.`);
    }
    
    return errors;
  };

  const handleFileSelect = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const allErrors = [];

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. Current: ${files.length}, Adding: ${fileArray.length}`);
      return;
    }

    // Validate files first
    fileArray.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        allErrors.push(...fileErrors);
      }
    });

    if (allErrors.length > 0) {
      setError(allErrors.join(' '));
      return;
    }

    // Upload files to backend
    setUploading(true);
    setUploadProgress(0);
    const uploadedFiles = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append('media', file);

        console.log(`📤 Uploading file: ${file.name}`);

        const response = await fetch(`${API_BASE_URL}/api/campaigns/upload-media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ File uploaded successfully:`, result.mediaFile);

        uploadedFiles.push(result.mediaFile);
        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }

      const newFiles = [...files, ...uploadedFiles];
      setFiles(newFiles);
      setError('');
      
      // Notify parent component with uploaded file data
      onFilesUploaded && onFilesUploaded(uploadedFiles);

    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setError(`Upload failed: ${uploadError.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = (fileId) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    setError('');
    onFilesUploaded && onFilesUploaded(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    const config = fileTypeConfig[fileType] || fileTypeConfig.default;
    const IconComponent = config.icon;
    return <IconComponent color={config.color} />;
  };

  const getFileLabel = (fileType) => {
    const config = fileTypeConfig[fileType] || fileTypeConfig.default;
    return config.label;
  };

  const openPreview = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  return (
    <Box>
      {/* Upload Area */}
      <Card
        sx={{
          border: '2px dashed',
          borderColor: error ? 'error.main' : 'grey.300',
          backgroundColor: disabled ? 'grey.100' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            backgroundColor: disabled ? 'grey.100' : 'primary.50'
          }
        }}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <UploadIcon sx={{ fontSize: 48, color: disabled ? 'grey.400' : 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom color={disabled ? 'textSecondary' : 'textPrimary'}>
            {uploading ? 'Uploading Files...' : disabled ? 'Upload Disabled' : 'Upload Media Files'}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {uploading 
              ? `Uploading... ${Math.round(uploadProgress)}%`
              : disabled 
                ? 'Please complete other steps first'
                : 'Drag and drop files here or click to browse'
            }
          </Typography>
          {uploading && (
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />
          )}
          <Typography variant="caption" color="textSecondary">
            Supported: Images (JPEG, PNG, GIF), PDFs • Max: {maxFiles} files, 10MB each
          </Typography>
          {!disabled && !uploading && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<UploadIcon />}>
                Choose Files
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading files... {Math.round(uploadProgress)}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selected Files ({files.length}/{maxFiles})
            </Typography>
            <List dense>
              {files.map((fileItem) => (
                <ListItem key={fileItem.id} divider>
                  <ListItemIcon>
                    {getFileIcon(fileItem.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {fileItem.name}
                        </Typography>
                        <Chip 
                          label={getFileLabel(fileItem.type)} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">
                          {formatFileSize(fileItem.size)}
                        </Typography>
                        {fileItem.status === 'ready' && <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                        {fileItem.status === 'error' && <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {fileItem.type.startsWith('image/') && (
                        <IconButton size="small" onClick={() => openPreview(fileItem)}>
                          <PreviewIcon />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => removeFile(fileItem.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          File Preview: {previewFile?.name}
        </DialogTitle>
        <DialogContent>
          {previewFile && previewFile.type.startsWith('image/') && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={previewFile.preview}
                alt={previewFile.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaUpload;