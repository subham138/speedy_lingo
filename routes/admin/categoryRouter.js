const express = require('express');
const categoryRouter = express.Router();
const Category = require('../../models/Category');
const dateFormat = require('dateformat');

// Fetch all categories
categoryRouter.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categoriesList', {
            title: 'Categories List',
            categories
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
});

// API endpoint for DataTable
categoryRouter.get('/api', async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
});

// Render edit category form
categoryRouter.get('/edit/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('admin/editCategory', {
            title: 'Edit Category',
            category
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading edit form', error: error.message });
    }
});

// Render add category form
categoryRouter.get('/add', async (req, res) => {
    try {
        res.render('admin/addCategory', {
            title: 'Add Category'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading form', error: error.message });
    }
});

// --- CREATE a new Category ---
// @route  POST /admin/categories
// @desc   Create a new category
// @access Private (should be protected by auth middleware)
/*
  Sample Body:
  {
    "name": "New Category Name"
  }

  Sample Curl:
  curl -X POST -H "Content-Type: application/json" -d '''{"name":"Grammar"}''' http://localhost:3000/admin/categories
*/
categoryRouter.post('/', async (req, res) => {
    try {
        const { name, info, user_name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Check if category with that name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        const newCategory = new Category({ name, info, created_by: user_name, created_dt: dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss") });
        await newCategory.save();

        // The auto-incremented 'id' will be on newCategory.id
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- UPDATE an existing Category ---
// @route  PUT /admin/categories/:id
// @desc   Update a category by its custom auto-incremented id
// @access Private
/*
  Sample Body:
  {
    "name": "Updated Category Name"
  }

  Sample Curl:
  curl -X PUT -H "Content-Type: application/json" -d '''{"name":"Advanced Grammar"}''' http://localhost:3000/admin/categories/1
*/
categoryRouter.put('/:id', async (req, res) => {
    try {
        const { name, info } = req.body;
        const categoryId = req.params.id;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { name, info, updated_dt: dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss") },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- DELETE a Category ---
// @route  DELETE /admin/categories/:id
// @desc   Delete a category by its MongoDB _id
// @access Private
categoryRouter.delete('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = { categoryRouter };
