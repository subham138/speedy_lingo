const adminRouter = require('express').Router();

const { categoryRouter } = require('./categoryRouter');
const { questRouter } = require('./questRouter');
const { subCategoryRouter } = require('./subCategoryRouter');

adminRouter.use('/dashboard', require('./dashboardRouter').dashboardRouter);
adminRouter.use('/userRecords', require('./userRecordRouter').userRecordRouter);
adminRouter.use('/category', categoryRouter);
adminRouter.use('/subcategory', subCategoryRouter);
adminRouter.use('/question', questRouter);
adminRouter.use('/assessment', require('./assessmentRouter').assessmentRouter);

module.exports = { adminRouter };