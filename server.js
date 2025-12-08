const express = require('express');
const path = require('path');
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/webhook', express.raw({ type: 'application/json' }), require("./routes/StripeWebhookRouter").StripeWebhookRouter);

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp'),
    tempFilePermissions: '644'
}));

// SET ASSETS AS A STATIC PATH //
app.use(express.static(path.join(__dirname, "assets/")));

// Set up the session middleware
app.use(
    session({
        secret: "SPEEDY_LINGO_SESSION_SECRET", // Change this to a secure random string
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 3600000,
        },
    }),
);

app.use(cookieParser());
app.use(expressLayouts);

app.use((req, res, next) => {
    if (req.path.startsWith('/user') || req.path.startsWith('/admin')) {
        res.locals.layout = 'templates/layout';
    } else {
        res.locals.layout = 'templates/website-layout/layout';
    }
    res.locals.path = req.path;
    res.locals.web_title = 'Speedy Lingo - Conversational Learning Platform';
    res.locals.message = req.session.message;

    delete req.session.message;
    next();
});

const connectDB = require('./db/db');
const { authenticateToken, setUserMiddleware, authCheckForLogin } = require('./middleware/authMiddleware');
app.use('/', authCheckForLogin, setUserMiddleware, require('./routes/website/websiteRouterIndex').WebsiteRouterIndex);
app.use('/admin', authenticateToken, setUserMiddleware, require('./routes/admin/adminRouterIndex').adminRouter);
app.use('/user', authenticateToken, setUserMiddleware, require('./routes/user/userRouterIndex').userRouterIndex);

const startServer = async () => {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();