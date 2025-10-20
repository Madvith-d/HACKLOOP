// Export all models from a single file for convenience
module.exports = {
  User: require('./User'),
  UserProfile: require('./UserProfile'),
  Conversation: require('./Conversation'),
  Message: require('./Message'),
  SessionSummary: require('./SessionSummary'),
  WellnessScore: require('./WellnessScore'),
  Journal: require('./Journal'),
  Habit: require('./Habit'),
  Appointment: require('./Appointment'),
  SafetyFlag: require('./SafetyFlag'),
  AuditLog: require('./AuditLog'),
};
