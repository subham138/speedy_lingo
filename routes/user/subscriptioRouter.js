const subscriptionRouter = require('express').Router();

subscriptionRouter.get('/', async (req, res) => {
    res.render('user/subscription/view', { title: 'Subscription' });
})

module.exports = { subscriptionRouter };