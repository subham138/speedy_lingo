const questRouter = require('express').Router();
const Question = require('../../models/Question'),
dateFormat = require('dateformat');

// Sample datasets for each question type

/*
// 1. select_correct
{
    "category_id": "60d21b4667d0d8992e610c85",
    "sub_category_id": "60d21b4667d0d8992e610c86",
    "question_level": "beginner",
    "question_type": "select_correct",
    "question_text": "What is the capital of France?",
    "options": [
        { "text": "Berlin" },
        { "text": "Madrid" },
        { "text": "Paris" },
        { "text": "Rome" }
    ],
    "correct_answer": "Paris"
}

// 2. fill_in_blanks
{
    "category_id": "60d21b4667d0d8992e610c85",
    "sub_category_id": "60d21b4667d0d8992e610c86",
    "question_level": "intermediate",
    "question_type": "fill_in_blanks",
    "question_text": "The quick brown fox jumps over the ___ dog.",
    "correct_answers": ["lazy"]
}

// 3. translate_phrase
{
    "category_id": "60d21b4667d0d8992e610c85",
    "sub_category_id": "60d21b4667d0d8992e610c86",
    "question_level": "advanced",
    "question_type": "translate_phrase",
    "question_text": "Hello, how are you?",
    "correct_answer": "Bonjour, comment ça va?"
}

// 4. describe_image
{
    "category_id": "60d21b4667d0d8992e610c85",
    "sub_category_id": "60d21b4667d0d8992e610c86",
    "question_level": "beginner",
    "question_type": "describe_image",
    "question_image": "path/to/image.jpg",
    "correct_answer": "A group of people sitting at a table."
}

// 5. audio_sentence
{
    "category_id": "60d21b4667d0d8992e610c85",
    "sub_category_id": "60d21b4667d0d8992e610c86",
    "question_level": "intermediate",
    "question_type": "audio_sentence",
    "question_audio": "path/to/audio.mp3",
    "word_bank": ["The", "quick", "brown", "fox"],
    "correct_answer_sequence": ["The", "quick", "brown", "fox"]
}

// 6. match_pairs
{
    "category_id": "60d21b4667d0d8992e610c85",
    "sub_category_id": "60d21b4667d0d8992e610c86",
    "question_level": "advanced",
    "question_type": "match_pairs",
    "left_options": [
        { "id": "1", "text": "Apple" },
        { "id": "2", "text": "Banana" }
    ],
    "right_options": [
        { "id": "a", "text": "Fruit" },
        { "id": "b", "text": "Vegetable" }
    ],
    "correct_matches": [
        { "left_id": "1", "right_id": "a" },
        { "left_id": "2", "right_id": "a" }
    ]
}
*/

// Add a new question
questRouter.post('/add', async (req, res) => {
    try {
        const data = req.body;
        data['created_dt'] = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
        const newQuestion = new Question(data);
        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully!', data: newQuestion });
    } catch (error) {
        res.status(400).json({ message: 'Error adding question', error: error.message });
    }
});

// Fetch all questions
questRouter.get('/', async (req, res) => {
    try {
        const questions = await Question.find();
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

// Fetch a question by ID
questRouter.get('/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching question', error: error.message });
    }
});

// Update a question by ID
questRouter.put('/:id', async (req, res) => {
    try {
        const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.status(200).json({ message: 'Question updated successfully!', data: updatedQuestion });
    } catch (error) {
        res.status(400).json({ message: 'Error updating question', error: error.message });
    }
});

// Delete a question by ID
questRouter.delete('/:id', async (req, res) => {
    try {
        const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
        if (!deletedQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.status(200).json({ message: 'Question deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting question', error: error.message });
    }
});

module.exports = { questRouter };
