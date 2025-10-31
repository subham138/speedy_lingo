const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const questionSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    question_display_in: {
        type: String,
        enum: ['outside', 'inside', 'both'],
        default: 'both'
    },
    // --- Common Fields for all question types ---
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    sub_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
    },
    question_level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    question_type: {
        type: String,
        enum: [
            'select_correct',     // Type 1
            'fill_in_blanks',     // Type 2
            'translate_phrase',   // Type 3
            'describe_image',     // Type 4
            'audio_sentence',     // Type 5
            'match_pairs'         // Type 6
        ],
        required: true
    },
    question_text: { type: String },
    question_audio: { type: String },
    question_image: { type: String },
    information: { type: String }, // Optional hint or extra info

    // --- Fields for questions with a list of choices (Types 1, 2, 3, 4) ---
    options: [{
        text: { type: String },
        audio: { type: String }
    }],

    // --- Fields for sentence formation from a word bank (Type 5) ---
    word_bank: [{ type: String }],

    // --- Fields for left-right matching (Type 6) ---
    left_options: [{ id: String, text: String, audio: String }],
    right_options: [{ id: String, text: String, audio: String }],

    // --- Fields for storing the correct answer(s) ---
    correct_answer: { type: String }, // For single-choice answers (e.g., the text of the correct option)
    correct_answers: [{ type: String }], // For multiple-choice/fill-in-the-blanks
    correct_answer_sequence: [{ type: String }], // For word order questions (Type 5)
    correct_matches: [{ left_id: String, right_id: String }], // For matching questions (Type 6)
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
    }
}, { collection: 'md_question_answer' });

questionSchema.plugin(mongooseSequence, {
    id: 'question_seq',
    inc_field: 'id',
    start_seq: 1
});

const Question = mongoose.model('Question', questionSchema, 'md_question_answer');

module.exports = Question;
