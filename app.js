if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const axios = require('axios');

// Import models
const User = require('./models/user');
const Plan = require('./models/plan');
const Expense = require('./models/expense');
const Trip = require('./models/trips');

// Database URL and environment variables
const dbUrl = process.env.ATLASDB_URL || 'mongodb://localhost:27017/fintech-tourism';
const secretKey = process.env.SECRET || 'defaultSecret';

// Connect to MongoDB
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true, // Enable TLS
    tlsAllowInvalidCertificates: true, // Allow invalid certificates (for dev/testing only)
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Error connecting to MongoDB:", err);
});



// Initialize Express app
const app = express();

// Session configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: secretKey },
    touchAfter: 24 * 3600,
});

store.on('error', err => {
    console.error('Session Store Error:', err);
});

app.use(session({
    store,
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
}));

// Middleware setup
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Routes
app.get('/', async (req, res) => {
    try {
        const trips = await Trip.find({});
        res.render('index', { trips });
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).send('Failed to load homepage');
    }
});

app.get('/find', (req, res) => {
    res.render('find');  // Assuming 'find.ejs' exists in the 'views' directory
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
  

app.get('/teammates', (req, res) => {
    res.render('teammates'); // Render the teammates page when this route is accessed
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

app.get('/plans', isAuthenticated, async (req, res) => {
    try {
        const plans = await Plan.find({ userId: req.session.userId });
        res.render('plans', { plans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).send('Failed to fetch plans');
    }
});

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


app.get('/expenses', isAuthenticated, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.session.userId });
        res.render('expenses', { expenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).send('Failed to fetch expenses');
    }
});

app.post('/add-expense', (req, res) => {
    const { description, amount } = req.body;

    // Assuming expenses is an array storing expenses
    const newExpense = { description, amount: parseInt(amount) };
    expenses.push(newExpense); // Add new expense to the expenses array

    res.json(newExpense); // Send the newly added expense as JSON response
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
          activity: Explore popular spots and enjoy local activities on Day ${i + 1},
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


app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/add-expense', (req, res) => {
  const { description, amount } = req.body;

  // Add the new expense to the in-memory expenses array
  expenses.push({ description, amount: parseFloat(amount) });

  // Redirect back to the trip-plan page, including the current plan and expenses
  res.redirect('/trip-plan');
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(400).send('Invalid username or password');
        }

        req.session.userId = user._id;
        res.redirect('/plans');
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Failed to login');
    }
});

app.get('/register', (req, res) => {
    res.render('register');
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
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Failed to register');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.redirect('/');
    });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
