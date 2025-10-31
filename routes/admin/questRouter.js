const questRouter = require('express').Router();
const Question = require('../../models/Question');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');
const dateFormat = require('dateformat');
const path = require('path');
const fs = require('fs');

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

// Render add question form
questRouter.get('/add', async (req, res) => {
    try {
        const categories = await Category.find();
        const subCategories = await SubCategory.find();
        res.render('admin/addQuestion', {
            title: 'Add Question',
            categories,
            subCategories
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading form', error: error.message });
    }
});

// Add a new question
questRouter.post('/add', async (req, res) => {
    try {
        const data = req.body;

        // Handle file uploads
        if (req.files) {
            if (req.files.question_audio) {
                const audioFile = req.files.question_audio;
                const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                await audioFile.mv(audioPath);
                data.question_audio = `/question/audio/${audioFile.name}`;
            }
            if (req.files.question_image) {
                const imageFile = req.files.question_image;
                const imagePath = path.join(__dirname, '../../assets/question/image', imageFile.name);
                await imageFile.mv(imagePath);
                data.question_image = `/question/image/${imageFile.name}`;
            }
        }

        // Process options with audio files
        if (data.options && Array.isArray(data.options)) {
            data.options = data.options.map((option, index) => {
                if (req.files && req.files[`options[${index}][audio]`]) {
                    const audioFile = req.files[`options[${index}][audio]`];
                    const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                    audioFile.mv(audioPath);
                    option.audio = `/question/audio/${audioFile.name}`;
                }
                return option;
            });
        }

        // Process left and right options for match_pairs
        if (data.left_options && Array.isArray(data.left_options)) {
            data.left_options = data.left_options.map((option, index) => {
                if (req.files && req.files[`left_options[${index}][audio]`]) {
                    const audioFile = req.files[`left_options[${index}][audio]`];
                    const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                    audioFile.mv(audioPath);
                    option.audio = `/question/audio/${audioFile.name}`;
                }
                return { id: (index + 1).toString(), ...option };
            });
        }

        if (data.right_options && Array.isArray(data.right_options)) {
            data.right_options = data.right_options.map((option, index) => {
                if (req.files && req.files[`right_options[${index}][audio]`]) {
                    const audioFile = req.files[`right_options[${index}][audio]`];
                    const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                    audioFile.mv(audioPath);
                    option.audio = `/question/audio/${audioFile.name}`;
                }
                return { id: String.fromCharCode(97 + index), ...option }; // a, b, c, etc.
            });
        }

        // Process correct_answers and correct_answer_sequence as arrays
        if (data.correct_answers && typeof data.correct_answers === 'string') {
            data.correct_answers = data.correct_answers.split(',').map(s => s.trim());
        }
        if (data.correct_answer_sequence && typeof data.correct_answer_sequence === 'string') {
            data.correct_answer_sequence = data.correct_answer_sequence.split(',').map(s => s.trim());
        }

        // Process correct_matches as JSON
        if (data.correct_matches && typeof data.correct_matches === 'string') {
            try {
                data.correct_matches = JSON.parse(data.correct_matches);
            } catch (e) {
                data.correct_matches = [];
            }
        }

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
        const questions = await Question.find().populate({ path: 'category_id', model: 'Category', select: 'name' }).populate({ path: 'sub_category_id', model: 'SubCategory', select: 'name' });
        res.render('admin/questionsList', {
            title: 'Questions List',
            questions
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

// API endpoint for DataTable
questRouter.get('/api', async (req, res) => {
    try {
        const questions = await Question.find().populate({ path: 'category_id', model: 'Category', select: 'name' }).populate({ path: 'sub_category_id', model: 'SubCategory', select: 'name' });
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

// Render edit question form
questRouter.get('/edit/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).send('Question not found');
        }
        const categories = await Category.find();
        const subCategories = await SubCategory.find();
        res.render('admin/editQuestion', {
            title: 'Edit Question',
            question,
            categories,
            subCategories
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading edit form', error: error.message });
    }
});

// Update a question by ID
questRouter.put('/:id', async (req, res) => {
    try {
        const data = req.body;

        // Handle file uploads
        if (req.files) {
            if (req.files.question_audio) {
                const audioFile = req.files.question_audio;
                const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                await audioFile.mv(audioPath);
                data.question_audio = `/question/audio/${audioFile.name}`;
            }
            if (req.files.question_image) {
                const imageFile = req.files.question_image;
                const imagePath = path.join(__dirname, '../../assets/question/image', imageFile.name);
                await imageFile.mv(imagePath);
                data.question_image = `/question/image/${imageFile.name}`;
            }
        }

        // Process options with audio files
        if (data.options && Array.isArray(data.options)) {
            data.options = data.options.map((option, index) => {
                if (req.files && req.files[`options[${index}][audio]`]) {
                    const audioFile = req.files[`options[${index}][audio]`];
                    const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                    audioFile.mv(audioPath);
                    option.audio = `/question/audio/${audioFile.name}`;
                }
                return option;
            });
        }

        // Process left and right options for match_pairs
        if (data.left_options && Array.isArray(data.left_options)) {
            data.left_options = data.left_options.map((option, index) => {
                if (req.files && req.files[`left_options[${index}][audio]`]) {
                    const audioFile = req.files[`left_options[${index}][audio]`];
                    const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                    audioFile.mv(audioPath);
                    option.audio = `/question/audio/${audioFile.name}`;
                }
                return { id: (index + 1).toString(), ...option };
            });
        }

        if (data.right_options && Array.isArray(data.right_options)) {
            data.right_options = data.right_options.map((option, index) => {
                if (req.files && req.files[`right_options[${index}][audio]`]) {
                    const audioFile = req.files[`right_options[${index}][audio]`];
                    const audioPath = path.join(__dirname, '../../assets/question/audio', audioFile.name);
                    audioFile.mv(audioPath);
                    option.audio = `/question/audio/${audioFile.name}`;
                }
                return { id: String.fromCharCode(97 + index), ...option }; // a, b, c, etc.
            });
        }

        // Process correct_answers and correct_answer_sequence as arrays
        if (data.correct_answers && typeof data.correct_answers === 'string') {
            data.correct_answers = data.correct_answers.split(',').map(s => s.trim());
        }
        if (data.correct_answer_sequence && typeof data.correct_answer_sequence === 'string') {
            data.correct_answer_sequence = data.correct_answer_sequence.split(',').map(s => s.trim());
        }

        // Process correct_matches as JSON
        if (data.correct_matches && typeof data.correct_matches === 'string') {
            try {
                data.correct_matches = JSON.parse(data.correct_matches);
            } catch (e) {
                data.correct_matches = [];
            }
        }

        data['modified_dt'] = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss");
        const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
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
