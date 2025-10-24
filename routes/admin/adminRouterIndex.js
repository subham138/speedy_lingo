const adminRouter = require('express').Router();

const { categoryRouter } = require('./categoryRouter');
const { questRouter } = require('./questRouter');
const { subCategoryRouter } = require('./subCategoryRouter');

adminRouter.use('/category', categoryRouter);
adminRouter.use('/subcategory', subCategoryRouter);
adminRouter.use(questRouter);

module.exports = {adminRouter};