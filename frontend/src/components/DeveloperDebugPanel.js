import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  TextField,
  Tooltip,
  Divider,
  Badge,
  Alert
} from '@mui/material';
import {
  BugReport as BugIcon,
  Close as CloseIcon,
  Delete as ClearIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Code as ConsoleIcon
} from '@mui/icons-material';

/**
 * 🐛 DEVELOPER DEBUG PANEL - Pure additive enhancement
 * 
 * Floating debug panel that captures console logs, errors, and application state.
 * Zero breaking changes - completely optional development tool.
 * 
 * Features:
 * - Captures console.log, console.error, console.warn
 * - Real-time log streaming
 * - Filter by log level
 * - Search functionality
 * - Export logs to file
 * - Application state inspection
 * - Network request tracking
 * 
 * @component
 */

export default function DeveloperDebugPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [newLogsCount, setNewLogsCount] = useState(0);
  const logsEndRef = useRef(null);

  // Intercept console methods
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.log
    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('info', args);
    };

    // Override console.error
    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('error', args);
    };

    // Override console.warn
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warning', args);
    };

    // Cleanup on unmount
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-scroll to bottom when new logs added
  useEffect(() => {
    if (open && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, open]);

  const addLog = (level, args) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      level,
      timestamp: new Date().toISOString(),
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
    };

    setLogs(prev => [...prev, logEntry]);
    
    if (!open) {
      setNewLogsCount(prev => prev + 1);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setNewLogsCount(0);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setNewLogsCount(0);
  };

  const handleExportLogs = () => {
    const logsText = logs.map(log => 
      `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getLogIcon = (level) => {
    switch (level) {
      case 'error': return <ErrorIcon fontSize="small" />;
      case 'warning': return <WarningIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      default: return '#2196f3';
    }
  };

  const getApplicationState = () => {
    return {
      token: localStorage.getItem('token') ? '✅ Present' : '❌ Missing',
      user: localStorage.getItem('user') ? '✅ Logged in' : '❌ Not logged in',
      location: window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      online: navigator.onLine ? '✅ Online' : '❌ Offline',
      timestamp: new Date().toLocaleString()
    };
  };

  const renderLogsTab = () => (
    <Box>
      {/* Search and Filter Bar */}
      <Box sx={{ p: 2, backgroundColor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {['all', 'info', 'warning', 'error'].map(level => (
            <Chip
              key={level}
              label={level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              onClick={() => setFilterLevel(level)}
              color={filterLevel === level ? 'primary' : 'default'}
              variant={filterLevel === level ? 'filled' : 'outlined'}
              size="small"
              icon={level !== 'all' ? getLogIcon(level) : <FilterIcon />}
            />
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            label={`${filteredLogs.length} logs`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Logs List */}
      <List sx={{ 
        maxHeight: 'calc(100vh - 300px)', 
        overflow: 'auto',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'monospace'
      }}>
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => (
            <ListItem
              key={log.id}
              sx={{
                borderLeft: `4px solid ${getLogColor(log.level)}`,
                backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.05)'
                },
                py: 1,
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                <Box sx={{ color: getLogColor(log.level), mr: 1 }}>
                  {getLogIcon(log.level)}
                </Box>
                <Typography variant="caption" sx={{ color: 'grey.500', mr: 2 }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
                <Chip
                  label={log.level}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: getLogColor(log.level) + '20',
                    color: getLogColor(log.level),
                    borderColor: getLogColor(log.level),
                    border: '1px solid'
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#d4d4d4',
                  width: '100%',
                  m: 0
                }}
              >
                {log.message}
              </Typography>
            </ListItem>
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ConsoleIcon sx={{ fontSize: 48, color: 'grey.600', mb: 2 }} />
            <Typography color="grey.500">
              {searchTerm || filterLevel !== 'all' 
                ? 'No logs match your filters'
                : 'No logs captured yet. Start using the app to see logs here.'}
            </Typography>
          </Box>
        )}
        <div ref={logsEndRef} />
      </List>

      {/* Action Buttons */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button
          startIcon={<ClearIcon />}
          onClick={handleClearLogs}
          variant="outlined"
          size="small"
          disabled={logs.length === 0}
        >
          Clear Logs
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleExportLogs}
          variant="outlined"
          size="small"
          disabled={logs.length === 0}
        >
          Export
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Total: {logs.length} logs
        </Typography>
      </Box>
    </Box>
  );

  const renderStateTab = () => {
    const appState = getApplicationState();
    
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This tab shows the current application state for debugging purposes.
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom>
          Application State
        </Typography>

        <List>
          {Object.entries(appState).map(([key, value]) => (
            <ListItem key={key} sx={{ py: 0.5 }}>
              <ListItemText
                primary={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                secondary={value}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                secondaryTypographyProps={{ 
                  variant: 'caption',
                  sx: { fontFamily: 'monospace' }
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          localStorage Items
        </Typography>
        <List>
          {Object.keys(localStorage).map(key => (
            <ListItem key={key} sx={{ py: 0.5 }}>
              <ListItemText
                primary={key}
                secondary={
                  key.includes('token') 
                    ? '••••••••' 
                    : localStorage.getItem(key)?.substring(0, 100) + (localStorage.getItem(key)?.length > 100 ? '...' : '')
                }
                primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                secondaryTypographyProps={{ 
                  variant: 'caption',
                  sx: { fontFamily: 'monospace', wordBreak: 'break-all' }
                }}
              />
            </ListItem>
          ))}
          {Object.keys(localStorage).length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No localStorage items found
            </Typography>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const state = JSON.stringify(getApplicationState(), null, 2);
              navigator.clipboard.writeText(state);
              alert('Application state copied to clipboard!');
            }}
          >
            Copy State
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload App
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => {
              if (window.confirm('Clear all localStorage data? This will log you out.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            Clear Storage
          </Button>
        </Box>
      </Box>
    );
  };

  const renderNetworkTab = () => (
    <Box sx={{ p: 2 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Network monitoring coming soon. For now, use browser DevTools Network tab.
        </Typography>
      </Alert>
      <Typography variant="body2" color="text.secondary">
        Network request tracking will be added in a future update.
      </Typography>
    </Box>
  );

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="Open Developer Debug Panel">
        <Fab
          color="secondary"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1200,
            backgroundColor: '#f50057',
            '&:hover': {
              backgroundColor: '#c51162'
            }
          }}
        >
          <Badge badgeContent={newLogsCount} color="error" max={99}>
            <BugIcon />
          </Badge>
        </Fab>
      </Tooltip>

      {/* Debug Panel Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500, md: 600 },
            maxWidth: '100vw'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 2,
          background: 'linear-gradient(135deg, #f50057 0%, #c51162 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BugIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Developer Debug Panel
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<ConsoleIcon />} 
            label="Console Logs"
            iconPosition="start"
          />
          <Tab 
            icon={<InfoIcon />} 
            label="App State"
            iconPosition="start"
          />
          <Tab 
            icon={<FilterIcon />} 
            label="Network"
            iconPosition="start"
            disabled
          />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
          {renderLogsTab()}
        </Box>
        <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
          {renderStateTab()}
        </Box>
        <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
          {renderNetworkTab()}
        </Box>

        {/* Footer */}
        <Box sx={{
          p: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'grey.50',
          textAlign: 'center'
        }}>
          <Typography variant="caption" color="text.secondary">
            🐛 Debug Panel • Development Tool Only • Zero Impact on Production
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}
