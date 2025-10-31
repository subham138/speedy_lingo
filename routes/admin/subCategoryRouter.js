const subCategoryRouter = require('express').Router();

const SubCategory = require('../../models/SubCategory');
const Category = require('../../models/Category');
const dateFormat = require('dateformat');

// Render add subcategory form
subCategoryRouter.get('/add', async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/addSubCategory', {
            title: 'Add Subcategory',
            categories
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading form', error: error.message });
    }
});

subCategoryRouter.post('/', async (req, res) => {
    try {
        const { name, is_icon, icon, category_id, user_name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Check if category with that name already exists
        const existingCategory = await SubCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Sub-Category with this name already exists' });
        }

        const newSubCategory = new SubCategory({ category_id, name, is_icon, icon, created_by: user_name, created_dt: dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss") });
        await newSubCategory.save();

        // The auto-incremented 'id' will be on newSubCategory.id
        res.status(201).json(newSubCategory);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
})

module.exports = { subCategoryRouter };