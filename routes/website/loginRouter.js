const loginRouter = require('express').Router();
const { createToken } = require('../../middleware/authMiddleware');
const Country = require('../../models/Country');
const User = require('../../models/User');
const { generateCaptcha } = require('../../modules/masterModules');
const dateFormat = require('dateformat'),
bcrypt = require("bcrypt");

loginRouter.get('/signup', async (req, res) => {
    const captcha = await generateCaptcha();
    const countryList = await Country.find({});
    req.session.captcha = captcha;
    res.render('website/signup', { title: 'Sign Up', script: ['/js/aos.js', '/js/website/createParticles.js', '/js/website/sign-up.js'], captcha: captcha, countryList: countryList ? (countryList.length > 0 ? countryList : []) : []});
})

loginRouter.post('/signup', async (req, res) => {
    var data = req.body;

    if (data.captcha !== req.session.captcha) {
        req.session.message = { type: 'error', title: 'Error', msg: 'Invalid captcha' };
        return res.redirect("/signup");
    }

    if(data.password !== data.repass){
        req.session.message = { type: 'error', title: 'Error', msg: 'Password does not match' };
        return res.redirect("/signup");
    }

    const chkUser = await User.findOne({ email: data.email });
    if (chkUser) {
        req.session.message = { type: 'error', type: 'Error', msg: 'User already exists' };
        return res.redirect("/signup");
    }

    try{
        const pass = bcrypt.hashSync(data.password, 10);
    
        const newUser = new User({ stripe_customer_id: '', user_id: data.email, password: pass, name: data.name, email: data.email, phone: null, country_id: data.country, user_type: 'U', active_flag: 'Y', created_by: data.name, created_dt: dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss") });
        await newUser.save();
        req.session.message = { type: 'success', title: 'Success', msg: 'User registered successfully' };
        res.redirect("/login");
    }catch(err){
        console.log(err);
        req.session.message = { type: 'error', title: 'Error', msg: 'Something went wrong' };
        res.redirect("/signup");
    }
})

loginRouter.post('/re-generate-captcha', async (req, res) => {
    const captcha = await generateCaptcha();
    req.session.captcha = captcha.text;
    res.send({suc: 1, msg: captcha });
})

loginRouter.get('/login', async (req, res) => {
    const captcha = await generateCaptcha();
    req.session.captcha = captcha;
    res.render('website/login', { title: 'Login', script: ['/js/aos.js', '/js/website/createParticles.js', '/js/website/sign-up.js'], captcha: captcha });
});

loginRouter.post('/login', async (req, res) => {
    var data = req.body;

    if (data.captcha !== req.session.captcha) {
        req.session.message = { type: 'error', title: 'Error', msg: 'Invalid captcha' };
        return res.redirect("/login");
    }

    const chkUser = await User.findOne({ email: data.user_id });
    if (chkUser) {
        if(chkUser.active_flag !== 'Y'){
            req.session.message = { type: 'warning', title: 'Warning', msg: 'User id is not active' };
            return res.redirect("/login");
        }

        if (await bcrypt.compareSync(data.password, chkUser.password)){
            req.session.user = chkUser;
            const token = await createToken(chkUser)
            res.cookie('auth_token', token, { httpOnly: true, secure: false });

            try{
                await User.findOneAndUpdate({ email: data.user_id }, { last_login: dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss") });
            }catch(err){
                console.log(err);
            }

            return res.redirect("/user/dashboard");
        }else{
            req.session.message = { type: 'warning', title: 'Warning', msg: 'Please check your user id or password.' };
            return res.redirect("/login");
        }
    }else{
        req.session.message = { type: 'warning', title: 'Warning', msg: 'This email id is not registered.' };
        return res.redirect("/login");
    }
})

loginRouter.get('/logout', async (req, res) => {
    res.clearCookie('auth_token');
    delete req.session.user;
    res.redirect("/login");
})

module.exports = {loginRouter};