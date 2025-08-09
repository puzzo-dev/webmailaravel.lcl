import { useCallback } from 'react';
import { userActivityService } from '../services/api';

/**
 * Custom hook for logging user activities
 * Provides easy-to-use methods for logging various user actions
 */
export const useActivityLogger = () => {
  const logActivity = useCallback(async (activityType, description, entityType = null, entityId = null, metadata = {}) => {
    try {
      await userActivityService.logActivity({
        activity_type: activityType,
        activity_description: description,
        entity_type: entityType,
        entity_id: entityId,
        metadata
      });
    } catch (error) {
      // Silently fail activity logging to not disrupt user experience
      console.warn('Failed to log user activity:', error);
    }
  }, []);

  // Convenience methods for common activities
  const logCampaignActivity = useCallback((action, campaign, metadata = {}) => {
    const descriptions = {
      created: `Created campaign '${campaign.name}'`,
      updated: `Updated campaign '${campaign.name}'`,
      sent: `Sent campaign '${campaign.name}'`,
      completed: `Campaign '${campaign.name}' completed successfully`,
      failed: `Campaign '${campaign.name}' failed`,
      paused: `Paused campaign '${campaign.name}'`,
      resumed: `Resumed campaign '${campaign.name}'`,
      deleted: `Deleted campaign '${campaign.name}'`
    };

    return logActivity(
      `campaign_${action}`,
      descriptions[action] || `Campaign ${action}: ${campaign.name}`,
      'campaign',
      campaign.id,
      { ...metadata, campaign_name: campaign.name, campaign_status: campaign.status }
    );
  }, [logActivity]);

  const logAuthActivity = useCallback((action, metadata = {}) => {
    const descriptions = {
      login: 'User logged in',
      logout: 'User logged out',
      register: 'User registered',
      password_reset: 'Password reset requested',
      password_changed: 'Password changed',
      profile_updated: 'Profile updated'
    };

    return logActivity(
      action,
      descriptions[action] || `Auth action: ${action}`,
      'user',
      null,
      metadata
    );
  }, [logActivity]);

  const logSubscriptionActivity = useCallback((action, subscription, metadata = {}) => {
    const descriptions = {
      created: `Subscribed to plan '${subscription.plan?.name || 'Unknown'}'`,
      updated: `Updated subscription to plan '${subscription.plan?.name || 'Unknown'}'`,
      cancelled: `Cancelled subscription to plan '${subscription.plan?.name || 'Unknown'}'`,
      renewed: `Renewed subscription to plan '${subscription.plan?.name || 'Unknown'}'`
    };

    return logActivity(
      `subscription_${action}`,
      descriptions[action] || `Subscription ${action}`,
      'subscription',
      subscription.id,
      { ...metadata, plan_name: subscription.plan?.name, subscription_status: subscription.status }
    );
  }, [logActivity]);

  const logDomainActivity = useCallback((action, domain, metadata = {}) => {
    const descriptions = {
      added: `Added domain '${domain.domain}'`,
      verified: `Verified domain '${domain.domain}'`,
      updated: `Updated domain '${domain.domain}'`,
      deleted: `Deleted domain '${domain.domain}'`
    };

    return logActivity(
      `domain_${action}`,
      descriptions[action] || `Domain ${action}: ${domain.domain}`,
      'domain',
      domain.id,
      { ...metadata, domain_name: domain.domain, domain_status: domain.status }
    );
  }, [logActivity]);

  const logSenderActivity = useCallback((action, sender, metadata = {}) => {
    const descriptions = {
      added: `Added sender '${sender.email}'`,
      verified: `Verified sender '${sender.email}'`,
      updated: `Updated sender '${sender.email}'`,
      deleted: `Deleted sender '${sender.email}'`
    };

    return logActivity(
      `sender_${action}`,
      descriptions[action] || `Sender ${action}: ${sender.email}`,
      'sender',
      sender.id,
      { ...metadata, sender_email: sender.email, sender_status: sender.status }
    );
  }, [logActivity]);

  return {
    logActivity,
    logCampaignActivity,
    logAuthActivity,
    logSubscriptionActivity,
    logDomainActivity,
    logSenderActivity
  };
};

export default useActivityLogger;
