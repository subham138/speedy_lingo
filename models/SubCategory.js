const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const subCategorySchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    category_id: {
        type: Number,
        ref: 'Category',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    is_icon: {
        type: Boolean,
        default: true
    },
    icon: {
        type: String,
        default: null
    },
    info: {
        type: String,
        default: null
    },
    bg_color: {
        type: String,
        default: null
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
}, { collection: 'md_sub_category' });

subCategorySchema.plugin(mongooseSequence, {
    id: 'subCategory_seq',
    inc_field: 'id',
    start_seq: 1
});

const SubCategory = mongoose.model('SubCategory', subCategorySchema, 'md_sub_category');

module.exports = SubCategory;
