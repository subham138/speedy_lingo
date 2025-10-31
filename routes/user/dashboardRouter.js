const dashRouter = require('express').Router();
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');

dashRouter.get('/', async (req, res) => {
    const catgList = await Category.find({});
    const subCatgList = await SubCategory.find({});
    // console.log(subCatgList);
    res.render('user/dashboard/userDashboard', { 
        title: 'User Dashboard', 
        catgList: catgList ? (catgList.length > 0 ? catgList : []) : [], 
        subCatgList: subCatgList ? (subCatgList.length > 0 ? subCatgList : []) : [] 
    });
})

module.exports = {dashRouter};