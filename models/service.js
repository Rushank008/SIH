const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  eligibility:  { type: String, required: true },
  requirements: [
    {
      label:     { type: String, required: true }, // e.g., "Aadhar Number"
      type:      { type: String, enum: ['text', 'file'], default: 'text' },
      required:  { type: Boolean, default: true }
    }
  ],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
