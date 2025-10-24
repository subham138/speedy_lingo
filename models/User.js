const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(mongooseSequence, { id: 'user_seq', inc_field: 'id', start_seq: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
