const webRouter = require('express').Router();

webRouter.get('/', (req, res) => {
    res.render('website/index', { title: 'Home' });
})

module.exports = {webRouter};