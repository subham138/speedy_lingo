const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const StripeProductSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    stripe_product_id: {
        type: String,
        required: true
    },
    product_type: {
        type: String,
        enum: ['standard'],
        default: 'standard'
    },
    description: {
        type: String,
    },
    plan_name: {
        type: String,
    },
    allowed_question:{
        type: Number,
        default: 0
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
}, { collection: 'md_product' });

StripeProductSchema.plugin(mongooseSequence, {
    id: 'product_seq',
    inc_field: 'id',
    start_seq: 1
});

const StripeProduct = mongoose.model('StripeProduct', StripeProductSchema, 'md_product');

module.exports = StripeProduct;