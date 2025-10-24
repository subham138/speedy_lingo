const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const categorySchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    info: {
        type: String,
    },
    created_by: {
        type: String,
        default: null
    },
    created_dt: {
        type: Date,
        default: null
    },
    updated_by: {
        type: String,
        default: null
    },
    updated_dt: {
        type: Date,
        default: null
    }
}, { collection: 'md_category' });

categorySchema.plugin(mongooseSequence, {
    id: 'category_seq',
    inc_field: 'id',
    start_seq: 1
});

const Category = mongoose.model('Category', categorySchema, 'md_category');

module.exports = Category;