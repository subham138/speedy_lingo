const WebsiteRouterIndex = require('express').Router();

WebsiteRouterIndex.use('/', require('./web_router').webRouter);
WebsiteRouterIndex.use('/', require('./loginRouter').loginRouter);
WebsiteRouterIndex.use('/', require('./quiz_web_router').quizWebRouter);

module.exports = {WebsiteRouterIndex};