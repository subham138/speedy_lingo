const mongoose = require('mongoose');

const UserQuestionProgressSchema = new mongoose.Schema({
    user_id: { type: Number, required: true },
    catg_id: { type: Number, required: true },
    sub_catg_id: { type: Number, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    last_set_at: { type: Date, default: null },
    last_question_ids: [{ type: Number, ref: 'Question' }], // most recent set
    history: [{
        question_id: { type: Number, ref: 'Question' },
        shown_at: { type: Date, default: Date.now }
    }]
}, { collection: 'td_user_progress' });

module.exports = mongoose.model('UserQuestionProgress', UserQuestionProgressSchema);
