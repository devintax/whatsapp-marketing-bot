import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person,
  Image as ImageIcon,
  Message,
  Close,
  AttachFile,
  WhatsApp as WhatsAppIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import WhatsAppPreview from './WhatsAppPreview';

export default function CampaignPreview({ 
  open, 
  onClose, 
  campaign, 
  onApprove, 
  onEdit, 
  loading 
}) {
  const [tabValue, setTabValue] = React.useState(0);
  
  if (!campaign) return null;

  // Handle approval for AI-generated campaigns
  const handleApprove = () => {
    if (onApprove && campaign.isAIGenerated) {
      // Pass campaign name and preview data for approval
      const campaignName = campaign.name || 'AI Generated Campaign';
      const previewData = campaign.preview || campaign;
      onApprove(campaignName, previewData);
    }
  };

  // Handle edit for AI-generated campaigns  
  const handleEdit = () => {
    if (onEdit && campaign.isAIGenerated) {
      onEdit(campaign.preview || campaign);
    }
  };

  // Get the message content for preview
  const getMessageContent = () => {
    if (campaign.content) return campaign.content;
    if (campaign.aiPrompt) return campaign.aiPrompt;
    if (campaign.design?.message_sequence && campaign.design.message_sequence.length > 0) {
      return campaign.design.message_sequence.map(msg => msg.content).join('\n\n');
    }
    if (campaign.generatedContent?.text) return campaign.generatedContent.text;
    return 'No content available';
  };

  const renderMediaPreview = (mediaFile) => {
    if (mediaFile.type && mediaFile.type.startsWith('image/')) {
      return (
        <Box sx={{ mt: 1, mb: 1 }}>
          <img 
            src={mediaFile.preview || `/uploads/campaigns/${mediaFile.name}`}
            alt={mediaFile.name}
            style={{
              maxWidth: '200px',
              maxHeight: '150px',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}
          />
        </Box>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Campaign Preview</Typography>
          <Button onClick={onClose} color="inherit" size="small">
            <Close />
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {campaign.name}
            </Typography>
            
            {campaign.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {campaign.description}
              </Typography>
            )}
            
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={campaign.type || 'promotional'} 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Tabbed Content View */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PreviewIcon sx={{ mr: 1 }} />
                      Raw Content
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WhatsAppIcon sx={{ mr: 1 }} />
                      WhatsApp Preview
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            {tabValue === 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Message sx={{ mr: 1, fontSize: 18 }} />
                  Raw Message Content
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 2,
                  border: '1px solid #ddd',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                    {getMessageContent()}
                  </Typography>
                </Box>
              </Box>
            )}

            {tabValue === 1 && (
              <WhatsAppPreview 
                message={getMessageContent()}
                title="📱 How it will appear in WhatsApp"
              />
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1, fontSize: 18 }} />
                Target Audience ({campaign.targetAudience?.totalCount || campaign.targetContacts?.length || 0} contacts)
              </Typography>
              
              {campaign.targetAudience?.tags && campaign.targetAudience.tags.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  {campaign.targetAudience.tags.map((tag, index) => (
                    <Chip 
                      key={index}
                      label={tag} 
                      size="small" 
                      variant="outlined" 
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
              
              {campaign.targetContacts && campaign.targetContacts.length > 0 && (
                <List dense>
                  {campaign.targetContacts.slice(0, 3).map((contact, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={contact.name || contact.phone}
                        secondary={contact.phone}
                      />
                    </ListItem>
                  ))}
                  {campaign.targetContacts.length > 3 && (
                    <ListItem>
                      <ListItemText 
                        primary={`... and ${campaign.targetContacts.length - 3} more contacts`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </Box>
            
            {campaign.mediaFiles && campaign.mediaFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1, fontSize: 18 }} />
                  Attached Media ({campaign.mediaFiles.length})
                </Typography>
                
                <Grid container spacing={2}>
                  {campaign.mediaFiles.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AttachFile sx={{ mr: 1, fontSize: 16 }} />
                            <Typography variant="body2" noWrap>
                              {file.name}
                            </Typography>
                          </Box>
                          
                          {renderMediaPreview(file)}
                          
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1, fontSize: 18 }} />
                Target Audience ({campaign.targetContacts?.length || 0} contacts)
              </Typography>
              
              {campaign.targetContacts && campaign.targetContacts.length > 0 ? (
                <List dense>
                  {campaign.targetContacts.slice(0, 5).map((contact, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={contact.name}
                        secondary={contact.phone}
                      />
                    </ListItem>
                  ))}
                  {campaign.targetContacts.length > 5 && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText 
                        secondary={`... and ${campaign.targetContacts.length - 5} more contacts`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No contacts selected
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {campaign.isAIGenerated ? 'Cancel' : 'Close'}
        </Button>
        
        {/* Show Approve and Edit buttons for AI-generated campaigns */}
        {campaign.isAIGenerated && onEdit && (
          <Button 
            onClick={handleEdit} 
            variant="outlined" 
            color="primary"
            disabled={loading}
          >
            Edit Campaign
          </Button>
        )}
        
        {campaign.isAIGenerated && onApprove && (
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve & Save Campaign'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}