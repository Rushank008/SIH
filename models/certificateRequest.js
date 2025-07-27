const mongoose = require('mongoose');

const certificateRequestSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service:    { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

  requirements: [ // user-submitted values
    {
      label:    { type: String, required: true },  // must match Service label
      type:     { type: String, enum: ['text', 'file'], default: 'text' },
      value:    { type: String, required: true }   // text or file URL (Cloudinary)
    }
  ],

  status:     { type: String, enum: ['submitted', 'in_process', 'approved', 'rejected'], default: 'submitted' },

  clerk:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  officer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  note:       { type: String },
  certificateUrl: { type: String },
  isLocked:   { type: Boolean, default: false },
  
  lockedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User', // assumes your staff are in User model
  default: null,
},

}, { timestamps: true });

module.exports = mongoose.model('CertificateRequest', certificateRequestSchema);
