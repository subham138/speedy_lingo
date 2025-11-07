const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userTestSessionSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    session_id: {
        type: String,
        required: true
    },
    category_id: {
        type: Number,
        required: true
    },
    sub_category_id: {
        type: Number,
        required: true
    },
    quest_type: {
        type: String,
        required: true
    },
    question_level: {
        type: String,
        required: true
    },
    total_questions: {
        type: Number,
        required: true
    },
    correct_answers: {
        type: Number,
        required: true
    },
    score_percentage: {
        type: Number,
        required: true
    },
    cefr_level: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    duration_minutes: {
        type: Number,
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
}, { collection: 'td_user_test_session' });

userTestSessionSchema.plugin(mongooseSequence, {
    id: 'user_test_session_seq',
    inc_field: 'id',
    start_seq: 1
});

const UserTestSession = mongoose.model('UserTestSession', userTestSessionSchema, 'td_user_test_session');

module.exports = UserTestSession;
