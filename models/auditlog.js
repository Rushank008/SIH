const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  certRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CertificateRequest',
    required: false // Not required for actions like creating services
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'officer', 'clerk', 'user'],
    required: true
  },
  action: {
    type: String,
    required: true // e.g., 'submitted', 'status_changed', 'approved'
  },
  message: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add TTL index to auto-delete documents 10 days after 'timestamp'
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 10 * 24 * 60 * 60 });
module.exports = mongoose.model('AuditLog', auditLogSchema);
