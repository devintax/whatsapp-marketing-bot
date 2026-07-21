import React from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  Business as BusinessIcon,
  IntegrationInstructions as IntegrationIcon
} from '@mui/icons-material';

function CRM() {
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">CRM Integrations</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              CRM Integrations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Connect your CRM systems to automatically sync contacts and streamline your WhatsApp marketing campaigns
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Instructions Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <IntegrationIcon sx={{ mr: 2, color: 'info.main', mt: 0.5 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              Getting Started with CRM Integration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Follow these steps to connect your CRM and start syncing contacts:
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Choose your CRM:</strong> Select from supported platforms (Mautic, HubSpot, Zoho, etc.)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Configure OAuth2:</strong> For Mautic, set up OAuth2 credentials in your CRM admin panel
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Authorize Access:</strong> Complete the OAuth2 flow to grant permissions
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Sync Contacts:</strong> Import contacts from your CRM to WhatsApp marketing campaigns
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Set up Webhooks:</strong> Enable real-time contact updates (optional)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Mautic Configuration Helper */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'info.50', borderLeft: 4, borderColor: 'info.main' }}>
        <Typography variant="h6" gutterBottom color="info.main">
          Mautic Configuration Details
        </Typography>
        <Typography variant="body2" paragraph>
          For Mautic integration, use these settings in your Mautic OAuth2 application:
        </Typography>
        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          <Typography variant="body2" component="div">
            <strong>Redirect URI:</strong> https://connect.vemgootech.info/api/auth/mautic/callback<br/>
            <strong>Webhook URL:</strong> https://api.vemgootech.info/webhook/mautic-contact<br/>
            <strong>Scopes:</strong> contacts:read contacts:write campaigns:read
          </Typography>
        </Box>
      </Paper>

      {/* CRM Integrations Access */}
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Access CRM Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          To configure and manage your CRM integrations, please visit the Contacts page.
        </Typography>
        <Typography variant="body2" color="primary.main">
          Navigate to: <strong>Contacts → CRM Integrations</strong>
        </Typography>
      </Paper>
    </Container>
  );
}

export default CRM;