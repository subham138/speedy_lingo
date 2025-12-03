const subCategoryRouter = require('express').Router();

const SubCategory = require('../../models/SubCategory');
const Category = require('../../models/Category');
const dateFormat = require('dateformat');

subCategoryRouter.get('/', async (req, res) => {
    try {
        const subCategories = await SubCategory.aggregate([
            {
                $lookup: {
                    from: "md_category",
                    localField: "category_id",
                    foreignField: "id",     // same as MySQL field
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $project: {
                    _id: 1,
                    id: 1,
                    name: 1,
                    category_id: 1,
                    icon: 1,
                    info: 1,
                    created_dt: 1,
                    // joined field
                    category_name: "$category.name"
                }
            }
        ])
        res.render('admin/sub-category/view', {
            title: 'Subcategories List',
            subCategories
        });
    } catch (error) {
        console.log({ message: 'Error fetching subcategories', error: error.message });
        res.render('admin/sub-category/view', {
            title: 'Subcategories List',
            subCategories: []
        });
    }
})

subCategoryRouter.get('/api', async (req, res) => {
    try {
        const subCategories = await SubCategory.aggregate([
            {
                $lookup: {
                    from: "md_category",
                    localField: "category_id",
                    foreignField: "id",     // same as MySQL field
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $project: {
                    _id: 1,
                    id: 1,
                    name: 1,
                    category_id: 1,
                    icon: 1,
                    info: 1,
                    is_icon: 1,
                    created_dt: 1,
                    // joined field
                    category_name: "$category.name"
                }
            }
        ]);
        res.status(200).json(subCategories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategories', error: error.message });
    }
});

// Render add subcategory form
subCategoryRouter.get('/add', async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/sub-category/entry', {
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