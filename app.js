const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const User = require('./models/User');
const Plan = require('./models/plan');
const Expense = require('./models/expense');
const Trip = require('./models/trips');
const axios = require('axios');
const app = express();
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }
    next();
};
mongoose.connect('mongodb://localhost:27017/fintech-tourism', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

// Session setup (for user management)
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: true
}));

// Home Page (index.ejs)
app.get('/', async (req, res) => {
  try {
    // Fetch all saved trips
    const trips = await Trip.find({});
    res.render('index', { trips }); // Pass trips to the template
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).send('Failed to load homepage');
  }
});

app.get('/profile/trips', async (req, res) => {
    try {
      // Assuming the user's ID is available in the request, e.g., from a session or JWT
      const userId = req.user.id;
  
      // Fetch trips associated with this user from the database
      const trips = await Trip.find({ userId: userId });
  
      res.json(trips); // Send the trips data as JSON
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).send('Failed to retrieve trips');
    }
  });
  
  app.post('/save-trip', async (req, res) => {
    console.log('Received request body:', req.body);
    const { plan, expenses } = req.body;

    if (!req.session.userId) {
        return res.status(400).send('User not logged in');
    }

    const trip = new Trip({
        userId: req.session.userId,
        totalBudget: plan.totalBudget,
        tripDays: plan.tripDays,
        dailyBudget: plan.dailyBudget,
        flights: plan.flights || [],
        itinerary: plan.itinerary || [],
        expenses: expenses || []
    });

    await trip.save();
    res.redirect('/profile');
});


app.get('/find', (req, res) => {
    res.render('find');  // Assuming 'find.ejs' exists in the 'views' directory
});

// Profile route to display saved trips for the logged-in user
app.get('/profile', isAuthenticated,async (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
  
    try {
      const trips = await Trip.find({ userId: req.session.userId });
      console.log('Retrieved trips:', JSON.stringify(trips, null, 2)); // Log trips for debugging
      res.render('profile', { trips });
    } catch (error) {
      console.error('Error fetching trips:', error);
      res.status(500).send('Failed to load profile');
    }
  });
  

// View Plans (plans.ejs)
app.get('/plans', async (req, res) => {
  // Check if the user is logged in
  if (!req.session.userId) {
      return res.redirect('/login');  // Redirect to login if user is not logged in
  }

  try {
      // Fetch plans from the database for the logged-in user
      const plans = await Plan.find({ userId: req.session.userId });

      // Render the plans view with the plans data
      res.render('plans', { plans });
  } catch (err) {
      console.error('Error fetching plans:', err);
      res.status(500).send('Error fetching plans');
  }
});



let expenses = []; // Initialize an array to store expenses
let plan = null;   // Initialize a variable to store the plan

app.post('/plan-trip', (req, res) => {
  const { startDate, endDate, budget } = req.body;

  // Parse dates and calculate trip length
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate the number of days in the trip (inclusive of start and end date)
  const tripDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Verify tripDays calculation
  console.log("Trip days:", tripDays);  // Debugging log to check trip duration

  // Calculate daily budget
  const dailyBudget = budget / tripDays;

  // Mock flight data for display
  const flights = [
      { airline: "Air India", price: 4000, departure: startDate, return: endDate },
      { airline: "IndiGo", price: 3500, departure: startDate, return: endDate },
      { airline: "SpiceJet", price: 3700, departure: startDate, return: endDate }
  ];

  // Generate an itinerary with sample activities for each day
  const itinerary = [];
  for (let i = 0; i < tripDays; i++) {
      itinerary.push({
          day: `Day ${i + 1}`,
          activity: `Explore popular spots and enjoy local activities on Day ${i + 1}`,
          expectedExpense: dailyBudget.toFixed(2)
      });
  }

  // Store the plan in memory for rendering on the trip plan page
  plan = {
      totalBudget: budget,
      tripDays,
      flights,
      dailyBudget: dailyBudget.toFixed(2),
      itinerary
  };

  // Reset expenses for this trip
  expenses = [];

  // Verify that the itinerary is correctly populated
  console.log("Generated itinerary:", itinerary);  // Debugging log

  // Render trip-plan page with the new plan and empty expenses
  res.render('trip-plan', { plan, expenses });
});

app.get('/teammates', (req, res) => {
    res.render('teammates'); // Render the teammates page when this route is accessed
});

// Add Plan (POST request from plans form)
app.post('/plans', async (req, res) => {
    const { day, places, totalCost } = req.body;

    const newPlan = new Plan({
        userId: req.session.userId,
        day,
        places: JSON.parse(places), // Convert places string to array of objects
        totalCost
    });

    try {
        await newPlan.save();
        res.redirect('/plans');
    } catch (err) {
        res.status(500).send('Error creating plan');
    }
});

// View Expenses (expenses.ejs)
app.get('/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.session.userId });
        res.render('expenses', { expenses });
    } catch (err) {
        res.status(500).send('Error retrieving expenses');
    }
});

app.post('/add-expense', (req, res) => {
    const { description, amount } = req.body;

    // Assuming `expenses` is an array storing expenses
    const newExpense = { description, amount: parseInt(amount) };
    expenses.push(newExpense); // Add new expense to the expenses array

    res.json(newExpense); // Send the newly added expense as JSON response
});


app.get('/trip-plan', (req, res) => {
  // Mock data for transportation options
  const transportOptions = {
      flights: [
          {
              flightName: "Air India AI202",
              departureAirport: "Delhi Indira Gandhi International Airport",
              arrivalAirport: "Jaipur International Airport",
              departureTime: "2024-12-10 08:00 AM",
              arrivalTime: "2024-12-10 09:30 AM",
              price: 3500
          },
          {
              flightName: "SpiceJet SG110",
              departureAirport: "Mumbai Chhatrapati Shivaji Maharaj International Airport",
              arrivalAirport: "Jaipur International Airport",
              departureTime: "2024-12-10 10:00 AM",
              arrivalTime: "2024-12-10 11:30 AM",
              price: 3200
          }
      ],
      trains: [
          {
              trainName: "Rajdhani Express",
              departureStation: "Delhi New Delhi Railway Station",
              arrivalStation: "Jaipur Junction",
              departureTime: "2024-12-10 05:00 AM",
              arrivalTime: "2024-12-10 11:00 AM",
              price: 1200
          },
          {
              trainName: "Shatabdi Express",
              departureStation: "Mumbai CST",
              arrivalStation: "Jaipur Junction",
              departureTime: "2024-12-10 07:00 AM",
              arrivalTime: "2024-12-10 01:30 PM",
              price: 1100
          }
      ],
      buses: [
          {
              busName: "RSRTC Deluxe",
              departurePoint: "Delhi ISBT Kashmiri Gate",
              arrivalPoint: "Jaipur Sindhi Camp",
              departureTime: "2024-12-10 06:00 AM",
              arrivalTime: "2024-12-10 10:00 AM",
              price: 600
          },
          {
              busName: "VRL Luxury",
              departurePoint: "Mumbai Borivali",
              arrivalPoint: "Jaipur Sindhi Camp",
              departureTime: "2024-12-10 09:00 AM",
              arrivalTime: "2024-12-10 02:30 PM",
              price: 700
          }
      ]
  };

  // Pass the transportOptions data to the EJS template
  res.render('report', { transportOptions: transportOptions, plan: plan, expenses: expenses });
});




app.post('/add-expense', (req, res) => {
  const { description, amount } = req.body;

  // Add the new expense to the in-memory expenses array
  expenses.push({ description, amount: parseFloat(amount) });

  // Redirect back to the trip-plan page, including the current plan and expenses
  res.redirect('/trip-plan');
});

// Register route
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/payment', (req, res) => {
    res.render('payment');
  });
  

app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match');
  }

  try {
      const existingUser = await User.findOne({ username });

      if (existingUser) {
          return res.status(400).send('Username already taken');
      }

      const newUser = new User({ username, password });
      await newUser.save();
      res.redirect('/login');  // Redirect to login page after successful registration
  } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).send('Error registering user');
  }
});


// Add Expense (POST request from expenses form)
app.post('/expenses', async (req, res) => {
    const { amount, description } = req.body;
    const newExpense = new Expense({
        userId: req.session.userId,
        amount,
        description
    });

    try {
        await newExpense.save();
        res.redirect('/expenses');
    } catch (err) {
      console.error("Error adding expense:", err);
        res.status(500).send('Error adding expense');
    }
});

// Login Route (for simplicity, without full authentication logic)
// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await User.findOne({ username });

      if (!user) {
          return res.status(400).send('Invalid username or password');
      }

      // Check password (no hashing here, so we directly compare plain text)
      if (user.password !== password) {
          return res.status(400).send('Invalid username or password');
      }

      // Store userId in session
      req.session.userId = user._id;
      res.redirect('/plans');  // Redirect to the plans page after successful login
  } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).send('Error logging in');
  }
});

// Log out
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/');
    });
});

// Start server
app.listen(8080, () => {
    console.log('Server running on http://localhost:3000');
});
