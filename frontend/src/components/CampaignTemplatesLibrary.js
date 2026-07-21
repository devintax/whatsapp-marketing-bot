import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ContentCopy,
  Search,
  LocalOffer,
  Campaign,
  Event,
  Announcement,
  CardGiftcard,
  TrendingUp
} from '@mui/icons-material';

/**
 * 📚 CAMPAIGN TEMPLATES LIBRARY - Pure additive enhancement
 * 
 * Pre-built campaign templates for quick campaign creation.
 * Zero breaking changes - purely optional feature.
 * 
 * @component
 * @param {Boolean} open - Dialog open state
 * @param {Function} onClose - Close handler
 * @param {Function} onSelectTemplate - Template selection handler
 */

// Pre-defined campaign templates
const CAMPAIGN_TEMPLATES = [
  {
    id: 'welcome_new_customer',
    name: 'Welcome New Customer',
    category: 'promotional',
    icon: <CardGiftcard />,
    color: '#1976d2',
    description: 'Welcome message for new customers with special offer',
    content: `🎉 Welcome to [Your Business Name]!

We're thrilled to have you as our newest customer!

As a special welcome gift, enjoy 15% OFF your first purchase with code: WELCOME15

✨ What makes us special:
• Premium quality products
• Fast, reliable delivery
• Outstanding customer service
• 100% satisfaction guarantee

Ready to start shopping? Reply YES and we'll send you our latest catalog!

Questions? Just reply to this message - we're here to help!

Thank you for choosing us! 🙏`,
    tags: ['welcome', 'new customer', 'discount', 'promotional'],
    targetAudience: 'New customers',
    tone: 'friendly'
  },
  {
    id: 'flash_sale',
    name: 'Flash Sale Alert',
    category: 'promotional',
    icon: <LocalOffer />,
    color: '#f57c00',
    description: 'Limited-time flash sale announcement',
    content: `⚡ FLASH SALE ALERT! ⚡

🔥 24 HOURS ONLY! 🔥

Get up to 50% OFF on selected items!

⏰ Sale ends: [Tomorrow at Midnight]

💎 Featured Deals:
• [Product 1] - 50% OFF
• [Product 2] - 40% OFF
• [Product 3] - 30% OFF

🛒 Shop Now: [Your Website/Link]

Don't miss out! This is our BIGGEST sale of the season!

Use code: FLASH50 at checkout

⚡ Limited quantities available - First come, first served!`,
    tags: ['sale', 'urgent', 'discount', 'limited time'],
    targetAudience: 'All customers',
    tone: 'urgent'
  },
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    category: 'reminder',
    icon: <Event />,
    color: '#9c27b0',
    description: 'Friendly appointment reminder message',
    content: `📅 Appointment Reminder

Hello [Customer Name]!

This is a friendly reminder about your upcoming appointment:

📍 Location: [Your Business Address]
🕐 Date & Time: [Appointment Date/Time]
👤 With: [Staff Name/Service]

✅ Please confirm by replying YES
❌ Need to reschedule? Reply RESCHEDULE

📝 What to bring:
• [Item 1]
• [Item 2]

We look forward to seeing you!

Questions? Call us at [Your Phone Number]

Thank you! 🙏`,
    tags: ['reminder', 'appointment', 'confirmation'],
    targetAudience: 'Appointment customers',
    tone: 'professional'
  },
  {
    id: 'seasonal_holiday',
    name: 'Holiday Greetings',
    category: 'seasonal',
    icon: <CardGiftcard />,
    color: '#d32f2f',
    description: 'Seasonal holiday wishes with special offer',
    content: `🎄 Happy Holidays from [Your Business Name]! 🎄

As we celebrate this wonderful season, we want to thank you for being such a valued customer!

🎁 SPECIAL HOLIDAY GIFT:
Use code HOLIDAY25 for 25% OFF your next order

🌟 This offer is our way of saying THANK YOU for your continued support!

⏰ Valid until: [End Date]
🛍️ Shop Now: [Your Website]

Wishing you and your loved ones a joyful holiday season filled with happiness, peace, and prosperity! ✨

Warm regards,
[Your Business Team]`,
    tags: ['holiday', 'seasonal', 'gratitude', 'discount'],
    targetAudience: 'All customers',
    tone: 'friendly'
  },
  {
    id: 'product_launch',
    name: 'New Product Launch',
    category: 'announcement',
    icon: <Announcement />,
    color: '#2e7d32',
    description: 'Exciting new product announcement',
    content: `🚀 EXCITING NEWS! 🚀

We're thrilled to announce our NEWEST product:

✨ [Product Name] ✨

[Brief product description - highlight main benefits]

💡 Why you'll love it:
✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

🎯 Perfect for: [Target use case]

🎁 LAUNCH SPECIAL:
Get 20% OFF for the first 50 customers!
Use code: LAUNCH20

📦 Available now: [Website Link]

Be among the first to experience [Product Name]!

Questions? Just reply to this message!`,
    tags: ['product launch', 'announcement', 'new product'],
    targetAudience: 'All customers',
    tone: 'professional'
  },
  {
    id: 'feedback_request',
    name: 'Customer Feedback Request',
    category: 'follow-up',
    icon: <TrendingUp />,
    color: '#00796b',
    description: 'Request customer feedback and reviews',
    content: `Hi [Customer Name]! 👋

Thank you for choosing [Your Business Name]!

We hope you're enjoying your recent purchase. Your opinion matters to us!

⭐ Could you spare 2 minutes to share your experience?

Your feedback helps us:
• Improve our products and services
• Serve you better
• Help other customers make informed decisions

📝 Leave a review: [Review Link]

As a thank you, we'll give you 10% OFF your next order when you complete the survey!

Discount code will be sent after review submission.

Thank you for helping us grow! 🙏

Best regards,
[Your Team]`,
    tags: ['feedback', 'review', 'follow-up', 'survey'],
    targetAudience: 'Recent customers',
    tone: 'friendly'
  },
  {
    id: 'reengagement',
    name: 'Customer Re-engagement',
    category: 'promotional',
    icon: <Campaign />,
    color: '#7b1fa2',
    description: 'Win back inactive customers',
    content: `We Miss You! 💙

Hi [Customer Name],

It's been a while since we last saw you, and we wanted to check in!

We've missed having you as part of our [Your Business Name] family.

🎁 SPECIAL COMEBACK OFFER:
Enjoy 30% OFF your next order!
Code: COMEBACK30

🆕 What's New:
• [New Product/Service 1]
• [New Product/Service 2]
• Improved customer experience
• Faster delivery options

This exclusive offer is just for valued customers like you!

⏰ Valid for 7 days only
🛍️ Shop Now: [Your Website]

We'd love to have you back!

Reply STOP if you'd prefer not to receive future messages.

Warmly,
[Your Business Team]`,
    tags: ['reengagement', 'winback', 'inactive', 'discount'],
    targetAudience: 'Inactive customers',
    tone: 'friendly'
  },
  {
    id: 'event_invitation',
    name: 'Event Invitation',
    category: 'event',
    icon: <Event />,
    color: '#f57c00',
    description: 'Invite customers to special event',
    content: `🎉 You're Invited! 🎉

[Event Name]

Join us for an exclusive event!

📅 Date: [Event Date]
🕐 Time: [Event Time]
📍 Location: [Event Venue/Link]

🌟 What to Expect:
• [Activity/Feature 1]
• [Activity/Feature 2]
• [Activity/Feature 3]
• Special discounts & giveaways!

🎟️ RSVP Required:
Reply YES to confirm your spot!
Limited seats available - First come, first served!

🎁 Exclusive Perks for Attendees:
• [Perk 1]
• [Perk 2]

Can't make it in person? We'll have a virtual option too!

Questions? Reply to this message or call [Phone Number]

We can't wait to see you there! ✨

[Your Business Team]`,
    tags: ['event', 'invitation', 'rsvp', 'exclusive'],
    targetAudience: 'VIP customers',
    tone: 'friendly'
  }
];

export default function CampaignTemplatesLibrary({ open, onClose, onSelectTemplate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter templates based on search and category
  const filteredTemplates = CAMPAIGN_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Templates', count: CAMPAIGN_TEMPLATES.length },
    { value: 'promotional', label: 'Promotional', count: CAMPAIGN_TEMPLATES.filter(t => t.category === 'promotional').length },
    { value: 'announcement', label: 'Announcement', count: CAMPAIGN_TEMPLATES.filter(t => t.category === 'announcement').length },
    { value: 'seasonal', label: 'Seasonal', count: CAMPAIGN_TEMPLATES.filter(t => t.category === 'seasonal').length },
    { value: 'event', label: 'Event', count: CAMPAIGN_TEMPLATES.filter(t => t.category === 'event').length },
    { value: 'reminder', label: 'Reminder', count: CAMPAIGN_TEMPLATES.filter(t => t.category === 'reminder').length },
    { value: 'follow-up', label: 'Follow-up', count: CAMPAIGN_TEMPLATES.filter(t => t.category === 'follow-up').length }
  ];

  const handleSelectTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Campaign sx={{ mr: 1 }} />
        Campaign Templates Library
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {/* Search and Filter Section */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search templates by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />
          
          {/* Category Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <Chip
                key={category.value}
                label={`${category.label} (${category.count})`}
                onClick={() => setSelectedCategory(category.value)}
                color={selectedCategory === category.value ? 'primary' : 'default'}
                variant={selectedCategory === category.value ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Templates Grid */}
        <Grid container spacing={2}>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 6,
                    borderColor: template.color
                  },
                  transition: 'all 0.2s',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Template Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        color: template.color,
                        backgroundColor: `${template.color}15`,
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        mr: 2
                      }}>
                        {template.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3">
                          {template.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>

                    {/* Content Preview */}
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1, 
                      mb: 2,
                      maxHeight: 120,
                      overflow: 'auto'
                    }}>
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                        {template.content.substring(0, 200)}...
                      </Typography>
                    </Box>

                    {/* Meta Info */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip 
                        size="small" 
                        label={`Tone: ${template.tone}`} 
                        variant="outlined"
                      />
                      <Chip 
                        size="small" 
                        label={template.targetAudience} 
                        variant="outlined"
                      />
                    </Box>

                    {/* Tags */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {template.tags.slice(0, 3).map(tag => (
                        <Chip 
                          key={tag} 
                          size="small" 
                          label={tag}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {template.tags.length > 3 && (
                        <Chip 
                          size="small" 
                          label={`+${template.tags.length - 3} more`}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Tooltip title="Copy template content">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(template.content);
                          // Could add a toast notification here
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button 
                      variant="contained"
                      size="small"
                      onClick={() => handleSelectTemplate(template)}
                      sx={{ 
                        backgroundColor: template.color,
                        '&:hover': {
                          backgroundColor: template.color,
                          filter: 'brightness(0.9)'
                        }
                      }}
                    >
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No templates found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or filters
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Templates Count */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
          Showing {filteredTemplates.length} of {CAMPAIGN_TEMPLATES.length} templates
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
