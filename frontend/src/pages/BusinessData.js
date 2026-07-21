// src/pages/BusinessData.js

import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { API_BASE_URL } from '../config/api';

const BusinessData = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [openUpload, setOpenUpload] = useState(false);
  const [trainBusyId, setTrainBusyId] = useState(null);
  const [filter, setFilter] = useState('');

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE_URL}/api/business-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch datasets (${res.status})`);
      const data = await res.json();
      setDatasets(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenUpload = () => setOpenUpload(true);
  const handleCloseUpload = () => {
    setOpenUpload(false);
    setFile(null);
  };

  const handleFileChange = (e) => setFile(e.target.files?.[0] || null);

  const handleUpload = async () => {
    if (!file) return;
    try {
      setSaving(true);
      setError('');
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'company_info'); // Default type
      form.append('description', `Uploaded file: ${file.name}`);
      form.append('content', `Business data uploaded from file: ${file.name}`);
      
      const res = await fetch(`${API_BASE_URL}/api/business-data`, {
        method: 'POST',
        body: form,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      await fetchDatasets();
      handleCloseUpload();
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSample = () => {
    window.open(`${API_BASE_URL}/api/business-data/sample/contacts`, '_blank', 'noopener,noreferrer');
  };

  const handleTrainAI = async (dataId) => {
    try {
      setTrainBusyId(dataId);
      setError('');
      const res = await fetch(`${API_BASE_URL}/api/ai/train/${encodeURIComponent(dataId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`AI training failed (${res.status})`);
      await fetchDatasets();
    } catch (e) {
      setError(e.message || 'AI training failed');
    } finally {
      setTrainBusyId(null);
    }
  };

  const visible = datasets.filter((d) => {
    if (!filter) return true;
    const text = `${d.title || d.name || ''} ${d.dataType || d.description || ''}`.toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Business Data
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadSample}
          >
            Sample CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleOpenUpload}
          >
            Upload Dataset
          </Button>
        </Stack>
      </Stack>

      <TextField
        fullWidth
        placeholder="Search datasets…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        size="small"
        sx={{ mb: 2 }}
      />

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <List dense disablePadding>
        {visible.length === 0 && !loading ? (
          <Typography variant="body2" color="text.secondary">
            No datasets found.
          </Typography>
        ) : (
          visible.map((d, idx) => (
            <React.Fragment key={d.id || d._id || idx}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      aria-label="train-ai"
                      onClick={() => handleTrainAI(d.id || d._id || idx)}
                      disabled={trainBusyId === (d.id || d._id || idx)}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={d.title || d.name || `Dataset ${idx + 1}`}
                  secondary={d.dataType || d.description || d.filename || ''}
                />
                {trainBusyId === (d.id || d._id || idx) && (
                  <Box minWidth={160} ml={2}>
                    <LinearProgress />
                  </Box>
                )}
              </ListItem>
              {idx < visible.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        )}
      </List>

      <Dialog open={openUpload} onClose={handleCloseUpload} fullWidth maxWidth="sm">
        <DialogTitle>Upload Business Dataset</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV (UTF-8). First row should be headers.
            </Typography>
            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
              Choose File
              <input type="file" hidden onChange={handleFileChange} accept=".csv,text/csv" />
            </Button>
            <Typography variant="body2">
              {file ? `Selected: ${file.name}` : 'No file selected'}
            </Typography>
            {saving && <LinearProgress />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={saving}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || saving} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessData;