import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Badge } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import MessageProgressTracker from './MessageProgressTracker';
import { useProgressTracker } from '../contexts/ProgressTrackerContext';
import { useNavigate } from 'react-router-dom';

const ProgressTrackerManager = () => {
  const { activeTrackers, stopTracking, retryFailedMessages } = useProgressTracker();
  const [minimizedTrackers, setMinimizedTrackers] = useState(new Set());
  const navigate = useNavigate();

  // Handle closing a tracker
  const handleCloseTracker = (trackerId) => {
    stopTracking(trackerId, 'user_closed');
    setMinimizedTrackers(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackerId);
      return newSet;
    });
  };

  // Handle retry for a specific tracker
  const handleRetryTracker = (trackerId, messageId) => {
    retryFailedMessages(trackerId, messageId);
  };

  // Navigate to analytics page
  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  // Calculate total active campaigns
  const totalActiveCampaigns = activeTrackers.length;
  const totalFailedMessages = activeTrackers.reduce(
    (sum, tracker) => sum + tracker.analytics.failedCount, 
    0
  );

  return (
    <>
      {/* Floating notification badge for minimized view */}
      {totalActiveCampaigns > 0 && (
        <Box
          position="fixed"
          top={20}
          right={20}
          zIndex={9998}
        >
          <Tooltip title={`${totalActiveCampaigns} active campaign(s)`}>
            <Badge 
              badgeContent={totalActiveCampaigns} 
              color="primary"
              overlap="circular"
            >
              <IconButton
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                  }
                }}
                onClick={() => {
                  // Show all trackers if any are minimized
                  setMinimizedTrackers(new Set());
                }}
              >
                <NotificationsIcon />
              </IconButton>
            </Badge>
          </Tooltip>
        </Box>
      )}

      {/* Render all active progress trackers */}
      {activeTrackers.map((tracker, index) => (
        <MessageProgressTracker
          key={tracker.id}
          isVisible={!minimizedTrackers.has(tracker.id)}
          campaignId={tracker.id}
          title={tracker.title}
          messages={tracker.messages}
          onClose={() => handleCloseTracker(tracker.id)}
          onRetry={(messageId, recipient) => handleRetryTracker(tracker.id, messageId)}
          onViewAnalytics={handleViewAnalytics}
          autoClose={tracker.analytics.failedCount === 0} // Only auto-close if no failures
          style={{
            bottom: 20 + (index * 420), // Stack trackers vertically
            right: 20
          }}
        />
      ))}
    </>
  );
};

export default ProgressTrackerManager;