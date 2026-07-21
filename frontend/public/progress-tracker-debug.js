/**
 * 🔧 PROGRESS TRACKER DEBUG & FIX SCRIPT
 * 
 * This script helps test the progress tracker functionality
 * and provides debugging for both local and external domain issues
 */

console.log('🔧 PROGRESS TRACKER DEBUG SCRIPT LOADED');

// Function to manually trigger progress tracker for testing
window.testProgressTracker = function() {
  console.log('🧪 MANUAL PROGRESS TRACKER TEST');
  
  // Create fake progress data for testing
  const fakeProgressData = {
    campaignId: `test_manual_${Date.now()}`,
    initialProgress: {
      sent: 5,
      failed: 2, 
      total: 20,
      currentBatch: 2,
      totalBatches: 3,
      completed: false
    },
    campaignName: 'Manual Test Campaign',
    totalRecipients: 20
  };
  
  console.log('🎯 Fake Progress Data:', fakeProgressData);
  
  // Try to find React component and trigger progress tracker
  if (window.React) {
    console.log('✅ React found, trying to trigger progress tracker...');
    
    // Dispatch a custom event that components can listen to
    const event = new CustomEvent('showProgressTracker', {
      detail: fakeProgressData
    });
    window.dispatchEvent(event);
    
    console.log('📡 Progress tracker event dispatched');
  } else {
    console.log('❌ React not found in window object');
  }
  
  // Also try to manually create the progress tracker in DOM
  createManualProgressTracker(fakeProgressData);
};

// Function to create a manual progress tracker in DOM for testing
function createManualProgressTracker(data) {
  console.log('🎨 Creating manual progress tracker...');
  
  // Remove existing test tracker
  const existing = document.getElementById('manual-progress-tracker');
  if (existing) existing.remove();
  
  // Create the tracker element
  const tracker = document.createElement('div');
  tracker.id = 'manual-progress-tracker';
  tracker.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 9999;
    padding: 16px;
    border: 2px solid #2196F3;
    font-family: Arial, sans-serif;
  `;
  
  tracker.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="margin: 0; color: #2196F3; font-size: 16px;">🚀 Campaign Progress (TEST)</h3>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Campaign:</strong> ${data.campaignName}
    </div>
    
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Progress:</span>
        <span>${data.initialProgress.sent + data.initialProgress.failed}/${data.initialProgress.total}</span>
      </div>
      <div style="background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
        <div style="background: #4CAF50; height: 100%; width: ${(data.initialProgress.sent / data.initialProgress.total) * 100}%;"></div>
      </div>
    </div>
    
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
        ✅ Sent: ${data.initialProgress.sent}
      </span>
      <span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
        ❌ Failed: ${data.initialProgress.failed}
      </span>
    </div>
    
    ${data.initialProgress.totalBatches > 1 ? `
      <div style="margin-bottom: 8px; font-size: 14px;">
        📦 Batch ${data.initialProgress.currentBatch} of ${data.initialProgress.totalBatches}
      </div>
    ` : ''}
    
    <div style="font-size: 12px; color: #666;">
      ${data.initialProgress.completed ? '✅ Campaign completed!' : '⏳ Sending in progress...'}
    </div>
  `;
  
  document.body.appendChild(tracker);
  console.log('✅ Manual progress tracker created and displayed');
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (tracker && tracker.parentElement) {
      tracker.remove();
      console.log('🗑️ Manual progress tracker auto-removed');
    }
  }, 30000);
}

// Function to check if the progress tracker components are loaded
window.checkProgressTrackerComponents = function() {
  console.log('🔍 CHECKING PROGRESS TRACKER COMPONENTS');
  
  // Check if the CampaignProgressTracker is in the DOM
  const progressTrackers = document.querySelectorAll('[data-testid*="progress"], [class*="progress"], [class*="Progress"]');
  console.log('🎯 Found potential progress elements:', progressTrackers.length);
  
  progressTrackers.forEach((el, index) => {
    console.log(`  ${index + 1}. Element:`, el.tagName, el.className, el.id);
  });
  
  // Check React components
  const reactRoot = document.getElementById('root');
  if (reactRoot) {
    console.log('✅ React root found');
    console.log('📊 React root children:', reactRoot.children.length);
  } else {
    console.log('❌ React root not found');
  }
  
  return {
    progressElements: progressTrackers.length,
    reactRoot: !!reactRoot
  };
};

// Function to test API connectivity
window.testAPIConnectivity = async function() {
  console.log('🌐 TESTING API CONNECTIVITY');
  
  const hostname = window.location.hostname;
  console.log('Current hostname:', hostname);
  
  let apiUrl;
  if (hostname === 'bot.dfgworld.net') {
    apiUrl = 'https://bot.dfgworld.net';
  } else if (hostname === 'connect.vemgootech.info') {
    apiUrl = 'https://api.vemgootech.info';
  } else if (hostname === '10.0.0.181') {
    apiUrl = 'http://10.0.0.181:5010';
  } else {
    apiUrl = `${window.location.protocol}//${window.location.host}`;
  }
  
  console.log('Testing API URL:', apiUrl);
  
  try {
    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API connectivity successful');
      console.log('Response status:', response.status);
      return true;
    } else {
      console.log('❌ API connectivity failed');
      console.log('Response status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API connectivity error:', error.message);
    console.log('Error details:', error);
    return false;
  }
};

// Auto-run diagnostics when script loads
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('🔧 AUTO-RUNNING PROGRESS TRACKER DIAGNOSTICS');
    window.checkProgressTrackerComponents();
    window.testAPIConnectivity();
    
    console.log('📝 AVAILABLE TEST FUNCTIONS:');
    console.log('  - testProgressTracker() - Manually show progress tracker');
    console.log('  - checkProgressTrackerComponents() - Check if components are loaded');
    console.log('  - testAPIConnectivity() - Test backend API connection');
    console.log('');
    console.log('💡 To test progress tracker manually, run: testProgressTracker()');
  }, 2000);
});

console.log('🎯 Progress Tracker Debug Script Ready!');
