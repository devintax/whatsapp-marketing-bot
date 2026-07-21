import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TipsAndUpdates as TipsIcon,
  Security as SecurityIcon,
  Campaign as CampaignIcon,
  Contacts as ContactsIcon,
  SmartToy as AIIcon,
  Speed as PerformanceIcon,
  Shield as ComplianceIcon
} from '@mui/icons-material';

const ProTips = () => {
  const [expanded, setExpanded] = useState('whatsapp-compliance');

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const tipCategories = [
    {
      id: 'whatsapp-connection',
      title: 'WhatsApp Connection Setup',
      icon: <SecurityIcon />,
      color: '#2e7d32',
      priority: 'CRITICAL',
      tips: [
        {
          title: 'First-Time WhatsApp Connection',
          description: 'Connect your WhatsApp account to send campaigns. This is a one-time setup that links your WhatsApp to the application.',
          example: 'Settings → WhatsApp Connection → Connect WhatsApp → Scan QR Code',
          impact: 'Critical - Required before sending any campaigns',
          steps: [
            'Go to Settings page in the application',
            'Scroll to "WhatsApp Connection Status" section',
            'Click "Connect WhatsApp" button',
            'Wait for QR code to appear (5-10 seconds)',
            'On your phone: WhatsApp → Settings → Linked Devices',
            'Tap "Link a Device" (NOT WhatsApp Web!)',
            'Scan the QR code on your computer screen',
            'Wait for "Status: Connected ✅" confirmation'
          ]
        },
        {
          title: 'Fix "Couldn\'t Link Device" Error',
          description: 'If QR code scans but shows error, you have corrupted session files. Clean them to fix.',
          example: 'Error: "Couldn\'t link device, try again later"',
          impact: 'Critical - Blocks all WhatsApp functionality',
          steps: [
            'Stop the backend server (Ctrl+C in terminal)',
            'Double-click: clean-whatsapp-sessions.bat',
            'Press any key to confirm cleanup',
            'Restart backend: cd backend && npm run dev',
            'Clear browser cache (Ctrl+Shift+Delete)',
            'Refresh page and try connecting again',
            'Use "Linked Devices" on phone, not WhatsApp Web',
            'Wait 15 minutes between connection attempts if failing'
          ]
        },
        {
          title: 'Fix "Status: Restoring" Stuck',
          description: 'If connection shows "Restoring..." for more than 60 seconds, the system auto-resets. You can also manually reset.',
          example: 'Shows "Restoring..." indefinitely with no QR code',
          impact: 'High - Prevents new connections',
          steps: [
            'Wait 30 seconds - "Reset Connection" button appears',
            'Click "Reset Connection" to force clear',
            'Or run: clean-whatsapp-sessions.bat',
            'Restart backend server',
            'Try connecting again with fresh QR code'
          ]
        },
        {
          title: 'Maintain Stable WhatsApp Connection',
          description: 'Keep WhatsApp connected for reliable campaign sending. Connection can drop if phone loses internet or WhatsApp is force-closed.',
          example: 'Best: Phone on WiFi with WhatsApp running in background',
          impact: 'High - Ensures campaigns don\'t fail mid-send',
          steps: [
            'Keep phone connected to stable WiFi or 4G',
            'Don\'t force-close WhatsApp app on phone',
            'Allow WhatsApp background data usage',
            'Remove old linked devices: Settings → Linked Devices',
            'WhatsApp allows max 5 linked devices',
            'Reconnect if status shows "Disconnected"'
          ]
        },
        {
          title: 'Test Connection Before Big Campaigns',
          description: 'Always test with yourself or small group before sending to thousands. Verify messages are sending correctly.',
          example: 'Send to yourself → Check formatting → Then send to all',
          impact: 'High - Prevents mass errors',
          steps: [
            'Add your own phone number to Contacts',
            'Create test campaign with just yourself',
            'Send the message',
            'Check if you receive it on WhatsApp',
            'Verify: formatting, links, personalization work',
            'If successful, send to full audience'
          ]
        }
      ]
    },
    {
      id: 'whatsapp-compliance',
      title: 'WhatsApp Compliance & Anti-Ban',
      icon: <ComplianceIcon />,
      color: '#d32f2f',
      priority: 'CRITICAL',
      tips: [
        {
          title: 'ALWAYS Personalize Messages',
          description: 'Add contact names to your database before sending campaigns. Personalized messages have <5% ban rate vs 80% for generic messages.',
          example: '✅ "Hi Vincent, check out..." vs ❌ "Hello, check out..."',
          impact: 'Critical - Primary ban prevention',
          steps: [
            'Import contacts with names from CSV',
            'Manually add names in Contact Management',
            'Use {firstName} or {name} placeholders in messages',
            'Check console for "100% personalization achieved!"'
          ]
        },
        {
          title: 'Start Small, Scale Gradually',
          description: 'New WhatsApp accounts get flagged faster. Warm up your account before sending to thousands.',
          example: 'Day 1: 10 contacts → Day 2: 20 → Week 1: 100 → Month 1: 1000',
          impact: 'Critical - Account longevity',
          steps: [
            'First campaign: 5-10 contacts maximum',
            'Monitor for 24 hours after each campaign',
            'Gradually increase volume by 2x weekly',
            'Never send more than your account can handle'
          ]
        },
        {
          title: 'Only Send to Opted-In Contacts',
          description: 'WhatsApp penalizes messages to random numbers. High failure rate = ban trigger.',
          example: '✅ Customers who gave you their number vs ❌ Purchased contact lists',
          impact: 'Critical - Compliance requirement',
          steps: [
            'Use only contacts who consented to receive messages',
            'Remove contacts who block/report you',
            'Include opt-out instructions in messages',
            'Maintain a "Do Not Contact" list'
          ]
        },
        {
          title: 'Use Ultra-Safe Batching for Large Lists',
          description: 'System automatically adjusts sending speed based on list size. For 10,000 contacts, expect ~31 hours delivery.',
          example: '5,000+ contacts: 5/batch, 8-12s delays, 90-130s pauses',
          impact: 'High - Prevents rate limiting',
          steps: [
            'Don\'t try to override batch delays',
            'Let the system work overnight for large campaigns',
            'Monitor console logs for batch progress',
            'Random pauses are intentional - they prevent detection'
          ]
        },
        {
          title: 'Vary Message Content',
          description: 'Identical messages to many people = spam flag. Use AI to generate slight variations.',
          example: '✅ Different greetings, emojis, phrasing vs ❌ Exact copy-paste',
          impact: 'Medium - Pattern detection avoidance',
          steps: [
            'Use AI Campaign Creator for natural variations',
            'Rotate message templates weekly',
            'Include personalization tokens',
            'Avoid promotional spam words (FREE, CLICK NOW, LIMITED TIME)'
          ]
        }
      ]
    },
    {
      id: 'ai-campaigns',
      title: 'AI Campaign Best Practices',
      icon: <AIIcon />,
      color: '#1976d2',
      priority: 'HIGH',
      tips: [
        {
          title: 'Provide Detailed Business Context',
          description: 'The more context you give AI, the better the campaign. Fill out Business Data completely.',
          example: '✅ "We offer tax planning for small businesses in Maryland" vs ❌ "We do taxes"',
          impact: 'High - Message quality',
          steps: [
            'Go to Settings → Business Data',
            'Fill out all fields: name, industry, services, USPs',
            'Add target audience details',
            'Update seasonally (tax season, holidays, etc.)'
          ]
        },
        {
          title: 'Use Personalization Placeholders',
          description: 'Tell AI to use {firstName} in prompts. System will automatically replace with actual names.',
          example: 'Prompt: "Create a message that starts with Hi {firstName}"',
          impact: 'Critical - Automatic personalization',
          steps: [
            'In AI campaign prompt, specify: "Use {firstName} for personalization"',
            'Available tokens: {firstName}, {name}, {email}',
            'System will replace before sending',
            'Check preview to verify replacement worked'
          ]
        },
        {
          title: 'Preview Before Approving',
          description: 'Always review AI-generated content for accuracy, tone, and compliance.',
          example: 'Check for: proper grammar, appropriate emojis, no spam words, clear CTA',
          impact: 'Medium - Brand consistency',
          steps: [
            'Review message in Campaign Preview',
            'Check for personalization tokens',
            'Verify links are correct',
            'Test with small batch first (5-10 contacts)'
          ]
        },
        {
          title: 'Choose the Right Campaign Type',
          description: 'Different campaign types have different purposes and formats.',
          example: 'Promotional: Sales offers | Educational: Tips & value | Event: Invitations',
          impact: 'Medium - Message effectiveness',
          steps: [
            'Promotional: Include clear offer + deadline',
            'Educational: Provide value without hard sell',
            'Event: Date, time, location, RSVP method',
            'Seasonal: Tie to holidays or seasons'
          ]
        }
      ]
    },
    {
      id: 'contact-management',
      title: 'Contact Management',
      icon: <ContactsIcon />,
      color: '#388e3c',
      priority: 'HIGH',
      tips: [
        {
          title: 'Import Contacts with Complete Data',
          description: 'CSV imports work best with: Name, Phone, Email, Tags. Missing data = less personalization.',
          example: 'CSV format: "Vincent Gbewonyo,+14432072634,vincent@example.com,vip,customer"',
          impact: 'High - Personalization capability',
          steps: [
            'Create CSV with columns: name, phone, email, tags',
            'Use E.164 format for phones: +1234567890',
            'Separate multiple tags with commas',
            'Import via Contacts → Import button'
          ]
        },
        {
          title: 'Use Tags for Segmentation',
          description: 'Tags let you send targeted campaigns. Tag autocomplete shows existing tags + counts.',
          example: 'Tags: "vip", "new-customer", "tax-season", "high-value", "needs-followup"',
          impact: 'High - Campaign targeting',
          steps: [
            'Create consistent tag naming (lowercase, hyphens)',
            'Use tags to filter campaign recipients',
            'Tag autocomplete shows: "customer (250)" for easy selection',
            'Update tags as customer status changes'
          ]
        },
        {
          title: 'Keep Contact Data Updated',
          description: 'Remove invalid numbers, update names, refresh tags regularly.',
          example: 'Monthly: Remove bounced numbers, update VIP status, add seasonal tags',
          impact: 'Medium - Deliverability',
          steps: [
            'After each campaign, review failed sends',
            'Remove contacts who block you',
            'Update tags based on engagement',
            'Export & backup contacts monthly'
          ]
        },
        {
          title: 'Export Contacts for Backup',
          description: 'Regular backups protect your contact list. Export filtered by tags.',
          example: 'Export "vip" customers separately for special campaigns',
          impact: 'Medium - Data safety',
          steps: [
            'Go to Contacts → Filter by tags',
            'Click Export button',
            'Save CSV file with date: contacts-2025-11-04.csv',
            'Store backups securely'
          ]
        }
      ]
    },
    {
      id: 'campaign-strategy',
      title: 'Campaign Strategy',
      icon: <CampaignIcon />,
      color: '#f57c00',
      priority: 'MEDIUM',
      tips: [
        {
          title: 'Test Small Before Going Big',
          description: 'Always test campaigns with 5-10 contacts first. Check delivery, formatting, links.',
          example: 'Send to yourself + team members → Review on mobile → Then send to full list',
          impact: 'High - Avoid mass mistakes',
          steps: [
            'Create campaign but don\'t approve yet',
            'Send test to yourself first',
            'Check message on actual WhatsApp mobile app',
            'Verify: formatting, links, personalization, emojis',
            'Then approve for full audience'
          ]
        },
        {
          title: 'Timing Matters',
          description: 'Send messages when recipients are most likely to engage. Avoid late nights.',
          example: 'Best: Tue-Thu 10am-2pm | Avoid: Weekends, late nights, holidays',
          impact: 'Medium - Engagement rate',
          steps: [
            'Schedule campaigns for business hours',
            'Consider timezone of recipients',
            'Avoid Monday mornings (inbox overload)',
            'Test different times and track engagement'
          ]
        },
        {
          title: 'Include Clear Call-to-Action',
          description: 'Every message should have ONE clear next step for the recipient.',
          example: '✅ "Reply YES to book" vs ❌ "Let us know if interested maybe sometime"',
          impact: 'Medium - Response rate',
          steps: [
            'One CTA per message',
            'Make it specific and actionable',
            'Provide easy response method',
            'Track responses in analytics'
          ]
        },
        {
          title: 'Monitor Campaign Analytics',
          description: 'Track delivery rates, failures, and patterns. Use insights to improve.',
          example: 'If failure rate >10%, review phone number formatting or list quality',
          impact: 'Medium - Continuous improvement',
          steps: [
            'Check Analytics page after each campaign',
            'Review: sent, failed, delivery rate',
            'Investigate failed numbers',
            'Compare campaign performance over time'
          ]
        }
      ]
    },
    {
      id: 'technical-performance',
      title: 'Technical & Performance',
      icon: <PerformanceIcon />,
      color: '#7b1fa2',
      priority: 'LOW',
      tips: [
        {
          title: 'Keep WhatsApp Connected',
          description: 'QR code session expires if WhatsApp Web isn\'t used. Reconnect weekly.',
          example: 'If stuck on "Restoring", click "Reset Connection" button',
          impact: 'High - System functionality',
          steps: [
            'Check Settings → WhatsApp Status weekly',
            'Keep phone connected to internet',
            'Don\'t log out of WhatsApp Web manually',
            'If disconnected: scan QR code again'
          ]
        },
        {
          title: 'Monitor Backend Logs',
          description: 'Console shows detailed progress during campaigns. Useful for debugging.',
          example: 'Look for: "100% personalization achieved!", "Batch 1/250", "Random delay: 8234ms"',
          impact: 'Low - Troubleshooting',
          steps: [
            'Keep backend terminal visible during campaigns',
            'Watch for error messages',
            'Random delays are normal (anti-ban feature)',
            'Long pauses (3-8 min) are intentional pattern breaks'
          ]
        },
        {
          title: 'Large Campaigns Take Time',
          description: '10,000 contacts = ~31 hours delivery. This is intentional for safety.',
          example: 'Start campaign at night, let it run while you sleep',
          impact: 'Low - Expectation management',
          steps: [
            'Don\'t expect instant delivery for large lists',
            'Ultra-safe batching prevents bans',
            'Speed vs Safety: We chose safety',
            'Check progress in Analytics page'
          ]
        },
        {
          title: 'Backend Crash Protection',
          description: 'System handles file lock errors gracefully. No more crashes!',
          example: 'If you see "EBUSY error" in logs, system continues anyway',
          impact: 'Low - Reliability',
          steps: [
            'System auto-recovers from most errors',
            'Backend won\'t crash during campaigns anymore',
            'If campaign stops, check WhatsApp connection',
            'Restart backend if needed: npm run dev'
          ]
        }
      ]
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL': return <SecurityIcon />;
      case 'HIGH': return <WarningIcon />;
      default: return <TipsIcon />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TipsIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">
            Pro Tips & Best Practices
          </Typography>
        </Box>
        <Typography variant="body1">
          Master the WhatsApp Marketing Bot with these expert tips. Updated regularly with new features and compliance guidelines.
        </Typography>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <SecurityIcon sx={{ fontSize: 40, color: '#d32f2f', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">5</Typography>
              <Typography variant="body2" color="text.secondary">Anti-Ban Tips</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <AIIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">4</Typography>
              <Typography variant="body2" color="text.secondary">AI Campaign Tips</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <ContactsIcon sx={{ fontSize: 40, color: '#388e3c', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">4</Typography>
              <Typography variant="body2" color="text.secondary">Contact Tips</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <CardContent>
              <CampaignIcon sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
              <Typography variant="h6" fontWeight="bold">4</Typography>
              <Typography variant="body2" color="text.secondary">Strategy Tips</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Alert */}
      <Alert severity="error" icon={<SecurityIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">🚨 Start Here: Critical Anti-Ban Tips</Typography>
        <Typography variant="body2">
          ALWAYS personalize messages with contact names and start small (5-10 contacts) before scaling.
          These are non-negotiable for WhatsApp compliance!
        </Typography>
      </Alert>

      {/* Tip Categories */}
      {tipCategories.map((category) => (
        <Accordion
          key={category.id}
          expanded={expanded === category.id}
          onChange={handleChange(category.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: expanded === category.id ? `${category.color}15` : 'inherit',
              '&:hover': { bgcolor: `${category.color}10` }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ color: category.color, mr: 2 }}>
                {category.icon}
              </Box>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {category.title}
              </Typography>
              <Chip
                label={category.priority}
                color={getPriorityColor(category.priority)}
                size="small"
                icon={getPriorityIcon(category.priority)}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {category.tips.map((tip, index) => (
              <Box key={index} sx={{ mb: index < category.tips.length - 1 ? 3 : 0 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ color: category.color, mr: 1, fontSize: 20 }} />
                  {tip.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {tip.description}
                </Typography>
                
                {tip.example && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Example:</strong> {tip.example}
                    </Typography>
                  </Alert>
                )}

                {tip.steps && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                      How to implement:
                    </Typography>
                    <List dense>
                      {tip.steps.map((step, stepIndex) => (
                        <ListItem key={stepIndex}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <Typography variant="body2" color={category.color} fontWeight="bold">
                              {stepIndex + 1}.
                            </Typography>
                          </ListItemIcon>
                          <ListItemText primary={step} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                <Chip
                  label={`Impact: ${tip.impact}`}
                  size="small"
                  sx={{ mt: 1 }}
                  color={tip.impact.includes('Critical') ? 'error' : tip.impact.includes('High') ? 'warning' : 'default'}
                />

                {index < category.tips.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Footer */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          💡 This guide is updated regularly as new features are added. Last updated: November 2025
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Have a tip to share? Contact support or submit feedback!
        </Typography>
      </Paper>
    </Container>
  );
};

export default ProTips;
