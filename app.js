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

app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.session.userId });
        res.render('profile', { trips });
    } catch (error) {
        console.error('Error fetching profile trips:', error);
        res.status(500).send('Failed to load profile');
    }
});

app.post('/save-trip', isAuthenticated, async (req, res) => {
    const { plan, expenses } = req.body;

    try {
        const trip = new Trip({
            userId: req.session.userId,
            totalBudget: plan.totalBudget,
            tripDays: plan.tripDays,
            dailyBudget: plan.dailyBudget,
            flights: plan.flights || [],
            itinerary: plan.itinerary || [],
            expenses: expenses || [],
        });

        await trip.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error saving trip:', error);
        res.status(500).send('Failed to save trip');
    }
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

app.post('/plans', isAuthenticated, async (req, res) => {
    const { day, places, totalCost } = req.body;

    try {
        const newPlan = new Plan({
            userId: req.session.userId,
            day,
            places: JSON.parse(places),
            totalCost,
        });

        await newPlan.save();
        res.redirect('/plans');
    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).send('Failed to create plan');
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

app.post('/expenses', isAuthenticated, async (req, res) => {
    const { description, amount } = req.body;

    try {
        const newExpense = new Expense({
            userId: req.session.userId,
            description,
            amount,
        });

        await newExpense.save();
        res.redirect('/expenses');
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).send('Failed to add expense');
    }
});

app.get('/trip-plan', (req, res) => {
    res.render('trip-plan', { plan: null, expenses: [] });
});

app.post('/plan-trip', (req, res) => {
    const { startDate, endDate, budget } = req.body;

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const tripDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const dailyBudget = (budget / tripDays).toFixed(2);

        const flights = [
            { airline: 'Air India', price: 4000, departure: startDate, return: endDate },
            { airline: 'IndiGo', price: 3500, departure: startDate, return: endDate },
        ];

        const itinerary = Array.from({ length: tripDays }, (_, i) => ({
            day: `Day ${i + 1}`,
            activity: `Explore popular spots and enjoy local activities on Day ${i + 1}`,
            expectedExpense: dailyBudget,
        }));

        res.render('trip-plan', {
            plan: { totalBudget: budget, tripDays, dailyBudget, flights, itinerary },
            expenses: [],
        });
    } catch (error) {
        console.error('Error planning trip:', error);
        res.status(500).send('Failed to plan trip');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
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
