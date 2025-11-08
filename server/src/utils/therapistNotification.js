const logger = require('./logger');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class TherapistNotificationService {
  async createAlert(userId, severity, message, details = {}) {
    try {
      const alertId = uuidv4();
      const now = new Date();
      
      await db.query(`
        INSERT INTO therapist_alerts (id, user_id, severity, message, details, created_at, read)
        VALUES ($1, $2, $3, $4, $5, $6, false)
      `, [alertId, userId, severity, message, JSON.stringify(details), now]);

      logger.info('Therapist alert created:', { alertId, userId, severity });
      return alertId;
    } catch (error) {
      logger.error('Error creating therapist alert:', error);
      throw error;
    }
  }

  async notifyTherapist(userId, alertType, content) {
    try {
      const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (user.rows.length === 0) {
        logger.warn('User not found for notification:', userId);
        return false;
      }

      const severity = this.determineSeverity(alertType);
      const message = this.generateMessage(alertType, user.rows[0].name);
      
      await this.createAlert(userId, severity, message, {
        alertType,
        userName: user.rows[0].name,
        userEmail: user.rows[0].email,
        content
      });

      if (severity === 'CRITICAL' || severity === 'HIGH') {
        await this.broadcastNotification(userId, severity, message);
      }

      return true;
    } catch (error) {
      logger.error('Error notifying therapist:', error);
      return false;
    }
  }

  determineSeverity(alertType) {
    const severityMap = {
      CRISIS: 'CRITICAL',
      SEVERE_DEPRESSION: 'CRITICAL',
      SUICIDAL_IDEATION: 'CRITICAL',
      URGENT_HELP_NEEDED: 'HIGH',
      SESSION_RECOMMENDED: 'MEDIUM',
      FOLLOW_UP_NEEDED: 'LOW'
    };
    return severityMap[alertType] || 'MEDIUM';
  }

  generateMessage(alertType, userName) {
    const messages = {
      CRISIS: `🚨 CRISIS ALERT: ${userName} requires immediate assistance`,
      SEVERE_DEPRESSION: `⚠️ SEVERE: ${userName} showing severe depression symptoms`,
      SUICIDAL_IDEATION: `🚨 CRITICAL: ${userName} expressing suicidal thoughts`,
      URGENT_HELP_NEEDED: `⚠️ ${userName} needs urgent therapeutic support`,
      SESSION_RECOMMENDED: `📋 Recommendation: ${userName} would benefit from a therapy session`,
      FOLLOW_UP_NEEDED: `📝 Follow-up: ${userName} may need a check-in session`
    };
    return messages[alertType] || `Notification for ${userName}`;
  }

  setIoInstance(io) {
    this.io = io;
  }

  async broadcastNotification(userId, severity, message) {
    try {
      if (this.io) {
        this.io.to(`therapist_notifications`).emit('therapist_alert', {
          userId,
          severity,
          message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.warn('Could not broadcast via socket.io:', error.message);
    }
  }

  async getAlerts(therapistId, filter = {}) {
    try {
      let query = `
        SELECT * FROM therapist_alerts
        WHERE read = COALESCE($1::boolean, read)
      `;
      const params = [filter.unreadOnly ? false : null];
      
      if (filter.severity) {
        query += ` AND severity = $${params.length + 1}`;
        params.push(filter.severity);
      }

      query += ` ORDER BY created_at DESC LIMIT ${filter.limit || 50}`;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId) {
    try {
      await db.query('UPDATE therapist_alerts SET read = true WHERE id = $1', [alertId]);
      return true;
    } catch (error) {
      logger.error('Error marking alert as read:', error);
      return false;
    }
  }
}

module.exports = new TherapistNotificationService();
