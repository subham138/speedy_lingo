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
    invoice_id: {
        type: String,
        required: true
    },
    subscription_id: {
        type: String,
        required: true
    },
    due_amount: {
        type: Number,
    },
    received_amount: {
        type: Number,
    },
    total_paied: {
        type: Number,
    },
    currency: {
        type: String,
        default: null
    },
    stripe_customer_id: {
        type: String,
    },
    payment_method_types: {
        type: String,
    },
    pay_status: {
        type: String,
    },
    failed_code: {
        type: String,
        default: null
    },
    failed_decline_code: {
        type: String,
        default: null
    },
    failed_message: {
        type: String,
        default: null
    },
    failed_type: {
        type: String,
        default: null
    },
    customer_email: {
        type: String,
        default: null
    },
    customer_name: {
        type: String,
        default: null
    },
    hosted_invoice_url: {
        type: String,
        default: null
    },
    invoice_pdf: {
        type: String,
    },
    full_json: {
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