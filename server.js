const express = require('express');
const path = require('path');
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SET ASSETS AS A STATIC PATH //
app.use(express.static(path.join(__dirname, "assets/")));

app.use(cookieParser());
app.use(expressLayouts);

app.use((req, res, next) => {
    if (req.path.startsWith('/user') || req.path.startsWith('/admin')) {
        res.locals.layout = 'templates/layout';
    } else {
        res.locals.layout = 'templates/website-layout/layout';
    }
    next();
});

const { adminRouter } = require('./routes/admin/adminRouterIndex');
const connectDB = require('./db/db');
app.use('/admin', adminRouter);

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