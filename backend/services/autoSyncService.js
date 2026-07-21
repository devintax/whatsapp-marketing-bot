const cron = require('node-cron');
const mongoose = require('mongoose');

// Import sync functions from CRM routes
let syncFunctions = null;

// Lazy load to avoid circular dependencies
function getSyncFunctions() {
  if (!syncFunctions) {
    try {
      // Load the sync functions from CRM module
      const crmModule = require('../routes/crm');
      syncFunctions = {
        mautic: crmModule.syncMauticContacts,
        suitecrm: crmModule.syncSuiteCRMContacts,
        zoho: crmModule.syncZohoContacts,
        hubspot: crmModule.syncHubSpotContacts,
        google: crmModule.syncGoogleContacts
      };
      console.log('✅ Loaded sync functions from CRM module');
    } catch (error) {
      console.error('❌ Could not load sync functions from CRM module:', error.message);
      syncFunctions = {};
    }
  }
  return syncFunctions;
}

// Import the CRM integration model and sync functions
const crmIntegrationSchema = require('../routes/crm');

class AutoSyncService {
  constructor() {
    this.activeJobs = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing Auto-Sync Service...');
    
    try {
      // Load existing CRM integrations and set up their schedules
      await this.loadExistingIntegrations();
      this.isInitialized = true;
      console.log('✅ Auto-Sync Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Auto-Sync Service:', error);
    }
  }

  async loadExistingIntegrations() {
    try {
      // Import the CRM Integration model
      const CRMIntegration = mongoose.model('CRMIntegration');
      
      // Find all active integrations with automatic sync enabled
      const integrations = await CRMIntegration.find({
        status: 'active',
        'settings.syncFrequency': { $ne: 'manual' }
      });

      console.log(`📋 Found ${integrations.length} integrations with automatic sync enabled`);

      for (const integration of integrations) {
        await this.scheduleSync(integration);
      }
    } catch (error) {
      console.error('❌ Error loading CRM integrations:', error);
    }
  }

  async scheduleSync(integration) {
    const { _id, settings, name, type } = integration;
    const syncFrequency = settings?.syncFrequency || 'manual';

    if (syncFrequency === 'manual') {
      console.log(`⏭️ Skipping manual sync for ${name} (${type})`);
      return;
    }

    // Cancel existing job if it exists
    if (this.activeJobs.has(_id.toString())) {
      this.activeJobs.get(_id.toString()).destroy();
    }

    // Convert frequency to cron expression
    const cronExpression = this.getCronExpression(syncFrequency);
    
    if (!cronExpression) {
      console.log(`❌ Invalid sync frequency: ${syncFrequency} for ${name}`);
      return;
    }

    console.log(`⏰ Scheduling ${syncFrequency} sync for ${name} (${type}) with cron: ${cronExpression}`);

    // Create and schedule the cron job
    const job = cron.schedule(cronExpression, async () => {
      await this.performSync(integration);
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Store the job reference
    this.activeJobs.set(_id.toString(), job);
    
    console.log(`✅ Scheduled automatic sync for ${name} (${syncFrequency})`);
  }

  getCronExpression(frequency) {
    switch (frequency) {
      case 'hourly':
        return '0 * * * *'; // Every hour at minute 0
      case 'daily':
        return '0 2 * * *'; // Every day at 2:00 AM
      case 'weekly':
        return '0 2 * * 0'; // Every Sunday at 2:00 AM
      default:
        return null;
    }
  }

  async performSync(integration) {
    try {
      console.log(`🔄 Starting automatic sync for ${integration.name} (${integration.type})`);
      
      const startTime = new Date();
      let syncResults = {
        imported: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      // Get sync functions
      const syncFuncs = getSyncFunctions();
      const syncFunction = syncFuncs[integration.type];
      
      if (!syncFunction) {
        throw new Error(`No sync function available for ${integration.type}`);
      }

      // Perform the sync
      syncResults = await syncFunction(integration, integration.user);

      // Update integration with sync results
      const CRMIntegration = mongoose.model('CRMIntegration');
      await CRMIntegration.findByIdAndUpdate(integration._id, {
        lastSync: startTime,
        lastSyncResults: syncResults,
        $push: {
          syncHistory: {
            date: startTime,
            results: syncResults,
            type: 'automatic'
          }
        }
      });

      const duration = (new Date() - startTime) / 1000;
      console.log(`✅ Automatic sync completed for ${integration.name}`);
      console.log(`📊 Results: +${syncResults.imported} imported, ~${syncResults.updated} updated, ⏭️${syncResults.skipped} skipped, ❌${syncResults.failed} failed`);
      console.log(`⏱️ Duration: ${duration}s`);

      // Log errors if any
      if (syncResults.errors && syncResults.errors.length > 0) {
        console.log(`⚠️ Errors during sync:`, syncResults.errors.slice(0, 3));
      }

    } catch (error) {
      console.error(`❌ Automatic sync failed for ${integration.name}:`, error.message);
      
      // Update integration with error status
      try {
        const CRMIntegration = mongoose.model('CRMIntegration');
        await CRMIntegration.findByIdAndUpdate(integration._id, {
          lastSync: new Date(),
          lastSyncResults: {
            imported: 0,
            updated: 0,
            skipped: 0,
            failed: 1,
            errors: [error.message]
          }
        });
      } catch (updateError) {
        console.error('❌ Failed to update integration error status:', updateError);
      }
    }
  }

  async updateIntegrationSchedule(integrationId, newFrequency) {
    try {
      const CRMIntegration = mongoose.model('CRMIntegration');
      const integration = await CRMIntegration.findById(integrationId);
      
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Cancel existing job
      if (this.activeJobs.has(integrationId)) {
        this.activeJobs.get(integrationId).destroy();
        this.activeJobs.delete(integrationId);
      }

      // Update the integration settings directly
      if (!integration.settings) {
        integration.settings = {};
      }
      integration.settings.syncFrequency = newFrequency;
      
      // Use updateOne to avoid validation issues
      await CRMIntegration.updateOne(
        { _id: integrationId },
        { $set: { 'settings.syncFrequency': newFrequency } }
      );

      // Schedule new job if not manual
      if (newFrequency !== 'manual') {
        // Fetch the updated integration for scheduling
        const updatedIntegration = await CRMIntegration.findById(integrationId);
        await this.scheduleSync(updatedIntegration);
      }

      console.log(`✅ Updated sync schedule for ${integration.name} to ${newFrequency}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update sync schedule:`, error);
      return false;
    }
  }

  async removeIntegrationSchedule(integrationId) {
    if (this.activeJobs.has(integrationId)) {
      this.activeJobs.get(integrationId).destroy();
      this.activeJobs.delete(integrationId);
      console.log(`✅ Removed sync schedule for integration ${integrationId}`);
    }
  }

  getActiveJobs() {
    return Array.from(this.activeJobs.keys()).map(id => ({
      integrationId: id,
      isRunning: this.activeJobs.get(id).running
    }));
  }

  async triggerManualSync(integrationId) {
    try {
      const CRMIntegration = mongoose.model('CRMIntegration');
      const integration = await CRMIntegration.findById(integrationId);
      
      if (!integration) {
        throw new Error('Integration not found');
      }

      console.log(`🚀 Triggering manual sync for ${integration.name}`);
      await this.performSync(integration);
      return true;
    } catch (error) {
      console.error(`❌ Manual sync failed:`, error);
      return false;
    }
  }

  async getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeJobs: this.getActiveJobs().length,
      scheduledJobs: this.getActiveJobs()
    };
  }
}

// Export singleton instance
const autoSyncService = new AutoSyncService();
module.exports = autoSyncService;