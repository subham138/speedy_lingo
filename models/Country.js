const mongoose = require('mongoose');
const mongooseSequence = require('mongoose-sequence')(mongoose);

const countrySchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    flag: {
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
}, { collection: 'md_country' });

countrySchema.plugin(mongooseSequence, {
    id: 'country_seq',
    inc_field: 'id',
    start_seq: 1
});

const Country = mongoose.model('Country', countrySchema, 'md_country');

module.exports = Country;