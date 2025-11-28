const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userSubscriptionSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    user_id: {
        type: Number,
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    month_yearly: {
        type: String,
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
    purchase_date: {
        type: Date,
        required: true
    },
    expires_date: {
        type: Date,
        required: true
    },
    stripe_customer_id: {
        type: String,
        required: true
    },
    stripe_subscription_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    full_json: {
        type: String,
        required: true
    },
    cancel_comment: {
        type: String,
        default: null
    },
    cancel_feedback: {
        type: String,
        default: null
    },
    cancel_reason: {
        type: String,
        default: null
    },
    canceled_at: {
        type: Date,
        default: null
    },
    canceled_json: {
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
    modified_by: {
        type: String,
        default: null
    },
    modified_dt: {
        type: Date,
        default: null
    }
}, { collection: 'td_user_subscription' });

userSubscriptionSchema.plugin(mongooseSequence, {
    id: 'user_subscription_seq',
    inc_field: 'id',
    start_seq: 1
});

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema, 'td_user_subscription');

module.exports = UserSubscription;