const mongoose = require('mongoose');

const UserQuestionProgressSchema = new mongoose.Schema({
    user_id: { type: Number, required: true, unique: true },
    last_set_at: { type: Date, default: null },
    last_question_ids: [{ type: Number, ref: 'Question' }], // most recent set
    history: [{
        question_id: { type: Number, ref: 'Question' },
        shown_at: { type: Date, default: Date.now }
    }]
}, { collection: 'td_user_progress' });

module.exports = mongoose.model('UserQuestionProgress', UserQuestionProgressSchema);
