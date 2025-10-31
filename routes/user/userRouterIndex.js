const userRouterIndex = require('express').Router();

userRouterIndex.use('/dashboard', require('./dashboardRouter').dashRouter);
userRouterIndex.use('/questions', require('./questRouter').questRouter);
userRouterIndex.use('/profile', require('./profileRouter').profileRouter);
userRouterIndex.use('/subscription', require('./subscriptioRouter').subscriptionRouter);

module.exports = {userRouterIndex};