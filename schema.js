const Joi = require('joi');

// Define your tourism schema using Joi
const tourismSchema = Joi.object({
    userId: Joi.string().required(),  // To identify the user
    destination: Joi.string().required(), // The city or place the user is visiting
    interests: Joi.array().items(Joi.string().valid('historical', 'adventure', 'nature', 'cultural')).required(),  // User's interests
    budget: Joi.number().min(0).required(),  // User's total budget for the trip
    startDate: Joi.date().required(),  // Start date of the trip
    endDate: Joi.date().required(),  // End date of the trip
    itinerary: Joi.array().items(
        Joi.object({
            date: Joi.date().required(),
            location: Joi.string().required(),  // Name of the location to visit
            category: Joi.string().valid('historical', 'adventure', 'nature', 'cultural').required(), // Type of location
            startTime: Joi.string().pattern(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/).required(),  // Time for the activity
            endTime: Joi.string().pattern(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/).required(),  // End time for the activity
            estimatedCost: Joi.number().min(0).required(),  // Estimated cost for the activity
        })
    ).required(),
    expenses: Joi.array().items(
        Joi.object({
            category: Joi.string().valid('transport', 'food', 'tickets', 'miscellaneous').required(),  // Type of expense
            amount: Joi.number().min(0).required(),  // Amount spent
            date: Joi.date().required(),  // Date of the expense
        })
    ).required(),
    totalSpent: Joi.number().min(0).required(),  // Total amount spent so far
    remainingBudget: Joi.number().min(0).required(),  // Remaining budget after spending
    paymentMethod: Joi.string().valid('MetaMask', 'Credit Card', 'Debit Card').optional(),  // Payment method used
    paymentStatus: Joi.string().valid('completed', 'pending').optional(),  // Status of payment
    recommendedLocations: Joi.array().items(Joi.string()).optional(),  // List of recommended locations nearby
});

module.exports = { tourismSchema };

