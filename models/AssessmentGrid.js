const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const assessmentGridSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    assessment_section:{
        type: String,
        enum: ['Understanding', 'Speaking', 'Writing'],
        required: true
    },
    assessment_for:[
        {
            name: { type: String, required: true },
            descriptio: {
                a1: { type: String },
                a2: { type: String },
                b1: { type: String },
                b2: { type: String },
                c1: { type: String },
                c2: { type: String },
            }
        }],
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
}, { collection: 'md_assessment_grid' })

assessmentGridSchema.plugin(mongooseSequence, {
    id: 'assessment_grid_seq',
    inc_field: 'id',
    start_seq: 1
});

const AssessmentGrid = mongoose.model('AssessmentGrid', assessmentGridSchema, 'md_assessment_grid');

module.exports = AssessmentGrid;