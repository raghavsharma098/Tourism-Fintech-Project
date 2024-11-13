const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true },
    places: [{ name: String, description: String, cost: Number }],
    totalCost: { type: Number }
});

module.exports = mongoose.model('Plan', planSchema);
