const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalBudget: Number,
    tripDays: Number,
    dailyBudget: Number,
    flights: Array,
    itinerary: Array,
    expenses: Array
});

module.exports = mongoose.model('Trip', tripSchema);

