const assessmentRouter = require('express').Router();
const dateFormat = require('dateformat');
const AssessmentGrid = require('../../models/AssessmentGrid');

// Add a new question
assessmentRouter.post('/add', async (req, res) => {
    try {
        const data = req.body;
        data['created_dt'] = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
        const newAssessment = new AssessmentGrid(data);
        await newAssessment.save();
        res.status(201).json({ message: 'Question added successfully!', data: newAssessment });
    } catch (error) {
        res.status(400).json({ message: 'Error adding question', error: error.message });
    }
});

module.exports = {assessmentRouter};