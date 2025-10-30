const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userQuestAnsSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    entry_dt: {
        type: Date,
        required: true
    },
    quest_id: {
        type: Number,
        required: true
    },
    answer:[{
        type: String,
        required: true
    }],
    is_correct: {
        type: Boolean,
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
}, { collection: 'td_user_quest_answer' });

userQuestAnsSchema.plugin(mongooseSequence, {
    id: 'user_quest_answer_seq',
    inc_field: 'id',
    start_seq: 1
});

const UserQuestAns = mongoose.model('UserQuestionAnswer', userQuestAnsSchema, 'td_user_quest_answer');

module.exports = UserQuestAns;