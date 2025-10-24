const webRouter = require('express').Router();

webRouter.get('/', (req, res) => {
    res.render('website/index', { title: 'Home' });
})

webRouter.get('/quiz', (req, res) => {
    res.render('website/quiz', { title: 'Quiz', script: '/js/website/quiz.js' });
});

webRouter.get('/result', (req, res) => {
    res.render('website/result', { title: 'Result', script: ['/js/aos.js', '/js/website/createParticles.js', '/js/website/result.js'] });
});

webRouter.get('/signup', (req, res) => {
    res.render('website/signup', { title: 'Sign Up', script: ['/js/aos.js', '/js/website/createParticles.js'] });
})

webRouter.get('/login', (req, res) => {
    res.render('website/login', { title: 'Login', script: ['/js/aos.js', '/js/website/createParticles.js'] });
});

module.exports = {webRouter};