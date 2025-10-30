const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    stripe_customer_id: {
        type: String,
        default: null
    },
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
    },
    profile_image: {
        type: String,
        required: false,
        default: null
    },
    country_id: {
        type: Number,
        required: true
    },
    user_type: {
        type: String,
        enum: ['A', 'U'],
        default: 'U'
    },
    active_flag: {
        type: String,
        enum: ['Y', 'N'],
        default: 'Y'
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
    },
    last_login: {
        type: Date,
        default: null
    }
}, { collection: 'md_user' });

userSchema.plugin(mongooseSequence, { id: 'user_seq', inc_field: 'id', start_seq: 1 });

const User = mongoose.model('User', userSchema, 'md_user');

module.exports = User;
