import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';

/**
 * 📱 WhatsApp Message Preview Component
 * Shows exactly how the message will appear in WhatsApp with proper formatting
 */
const WhatsAppPreview = ({ message, title = "WhatsApp Preview" }) => {
  // Apply the same formatting logic as the backend
  const formatMessageForWhatsApp = (text) => {
    if (!text) return '';
    
    let formatted = text;
    
    // Step 1: Normalize line breaks
    formatted = formatted
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    // Step 2: WhatsApp-Optimized Spacing Preservation
    formatted = formatted
      .replace(/━━━━━━━━━━━━━━━━━━━━━/g, '▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔')  // Different Unicode divider
      .replace(/    /g, '\u2003\u2003')   // Em spaces for 4-space indents
      .replace(/   /g, '\u2003')          // Em space for 3-space indents  
      .replace(/  /g, '\u2002')           // En space for 2-space indents
      .replace(/\n\n\n+/g, '\n\n')        // Max 2 line breaks
      .replace(/\t/g, '\u2003');          // Replace tabs with em space
    
    // Step 3: Preserve emoji spacing and structure
    formatted = formatted
      .replace(/(🏡|🌟|📋|✨|🎁|🔐|📞|📍|✉️|🌐|📱|💬|🎯|⭐|💼|📧|📊)/g, '\n$1 ') // Line break + emoji + space
      .replace(/(\*[^*]+\*)/g, '*$1*')    // Ensure bold formatting
      .replace(/\s{3,}/g, '\u2003')       // Replace 3+ spaces with em space
      .replace(/\n /g, '\n')              // Remove leading spaces after line breaks
      .replace(/\n\u2003/g, '\n\u2003');  // Keep intentional indentation
    
    // Step 4: Professional section separators
    formatted = formatted
      .replace(/▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n([^\n])/g, '▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n\n$1')
      .replace(/([^\n])\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔/g, '$1\n\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .replace(/\n\s+\n/g, '\n\n')
      .replace(/\s+$/gm, '');
    
    // Step 5: WhatsApp message length check
    if (formatted.length > 4000) {
      formatted = formatted.substring(0, 4000).trim() + '\n\n📄 [Message continues...]';
    }
    
    return formatted;
  };

  const copyToClipboard = () => {
    const formattedMessage = formatMessageForWhatsApp(message);
    navigator.clipboard.writeText(formattedMessage);
  };

  const formattedMessage = formatMessageForWhatsApp(message);
  const stats = {
    length: formattedMessage.length,
    lineBreaks: (formattedMessage.match(/\n/g) || []).length,
    emSpaces: (formattedMessage.match(/\u2003/g) || []).length,
    enSpaces: (formattedMessage.match(/\u2002/g) || []).length,
    dividers: (formattedMessage.match(/▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔/g) || []).length
  };

  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <WhatsAppIcon sx={{ color: '#25D366', mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Tooltip title="Copy WhatsApp-formatted message">
          <IconButton onClick={copyToClipboard} size="small">
            <CopyIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* WhatsApp-style message bubble */}
      <Paper 
        elevation={1}
        sx={{ 
          p: 2,
          backgroundColor: '#E3F2FD', // WhatsApp sent message color
          borderRadius: '18px 18px 4px 18px',
          maxWidth: '80%',
          marginLeft: 'auto',
          fontFamily: 'Roboto, sans-serif',
          fontSize: '14px',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          border: '1px solid #25D366',
          position: 'relative'
        }}
      >
        <Typography 
          component="div"
          sx={{ 
            fontFamily: 'Roboto, Arial, sans-serif',
            fontSize: '14px',
            lineHeight: 1.4,
            color: '#262626',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {formattedMessage}
        </Typography>
        
        {/* WhatsApp message tail */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: 0,
            height: 0,
            borderLeft: '8px solid #E3F2FD',
            borderBottom: '8px solid transparent'
          }}
        />
      </Paper>

      {/* Formatting Statistics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Chip 
          size="small" 
          label={`${stats.length} chars`} 
          color={stats.length > 4000 ? 'error' : stats.length > 3000 ? 'warning' : 'success'}
        />
        <Chip size="small" label={`${stats.lineBreaks} line breaks`} />
        <Chip size="small" label={`${stats.emSpaces} em spaces`} />
        <Chip size="small" label={`${stats.enSpaces} en spaces`} />
        <Chip size="small" label={`${stats.dividers} dividers`} />
        <Chip 
          size="small" 
          label="WhatsApp Optimized" 
          color="success"
          icon={<WhatsAppIcon />}
        />
      </Box>

      {stats.length > 4000 && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          ⚠️ Message exceeds WhatsApp's recommended length and will be truncated
        </Typography>
      )}
    </Box>
  );
};

export default WhatsAppPreview;