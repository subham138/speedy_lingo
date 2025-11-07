const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userSubscriptionSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    month_yearly: {
        type: Number,
        required: true
    },
    purchase_date: {
        type: Number,
        required: true
    },
    expires_date: {
        type: String,
        required: true
    },
    stripe_customer_id: {
        type: String,
        required: true
    },
    stripe_subscription_id: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    full_json: {
        type: Date,
        required: true
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