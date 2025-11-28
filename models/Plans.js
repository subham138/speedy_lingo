const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const StripePlanSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    prod_id: {
        type: Number,
        required: true
    },
    stripe_product_id: {
        type: String,
        required: true
    },
    stripe_plan_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    interval: {
        type: String
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
}, { collection: 'md_plans' });

StripePlanSchema.plugin(mongooseSequence, {
    id: 'plans_seq',
    inc_field: 'id',
    start_seq: 1
});

const StripePlan = mongoose.model('StripePlan', StripePlanSchema, 'md_plans');

module.exports = StripePlan;