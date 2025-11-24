const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userTransactionSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    entry_dt:{
        type: Date,
        default: Date.now
    },
    user_id: {
        type: Number,
        required: true
    },
    product_name: {
        type: String,
        required: true
    },
    product_stripe_id: {
        type: String,
        required: true
    },
    month_yearly: {
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
}, { collection: 'td_user_transaction' });

userTransactionSchema.plugin(mongooseSequence, {
    id: 'user_transaction_seq',
    inc_field: 'id',
    start_seq: 1
});

const UserTransaction = mongoose.model('UserTransaction', userTransactionSchema, 'td_user_transaction');

module.exports = UserTransaction;