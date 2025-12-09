const quizWebRouter = require('express').Router();
const AssessmentGrid = require('../../models/AssessmentGrid');
const Question = require('../../models/Question');
const { shuffleOptions } = require('../../modules/masterModules');

quizWebRouter.get('/quiz', async (req, res) => {
    try{
        // @ select questions from DB based on the question_display_in as 'outside' or 'both'
        const questListRaw = await Question.find({ question_display_in: { $in: ['outside', 'both'] }, active_flag: 'Y' }).sort({ question_type: 1});
        var questList = null
        if (questListRaw){
            if (questListRaw.length > 0){
                questList = shuffleOptions([...questListRaw])
            }
        }
        res.render('website/quiz', { 
            title: 'Quiz', 
            script: '/js/website/quiz.js', 
            data: (questList ? (questList.length > 0 ? questList : []) : []),
            shuffle: shuffleOptions,
            last_ans_quest_index: -1
        });
    }catch(err){
        console.log(err);
    }
});

quizWebRouter.get('/result', async (req, res) => {
    try {
        const assessment = await AssessmentGrid.find({});
        res.render('website/result', { title: 'Result', script: ['/js/aos.js', '/js/website/createParticles.js', '/js/website/result.js'], data: (assessment ? (assessment.length > 0 ? assessment : []) : []) });
    } catch (err) {
        console.log(err);
    }
});

quizWebRouter.post('/check-answer', async(req, res) => {
    const data = req.body;
    console.log(JSON.stringify(data));

    if(data && data.answers){
        let score = 0;
        let total = 0;
        if(Object.keys(data.answers).length > 0){
            for(const qtype in data.answers){
                console.log(qtype);
                for(const qnum in data.answers[qtype]){
                    total += 1;
                    const ansData = data.answers[qtype][qnum];
                    let actualQuestDt = await Question.findOne({ id: ansData.qId });
                    // console.log(actualQuestDt);
                    
                    if(actualQuestDt){
                        // console.log(actualQuestDt.correct_answers[0].toLowerCase().trim(), '++__++', ansData.ans.toLowerCase().trim());
                        switch (qtype) {
                            case 'select-correct':
                                if (actualQuestDt.correct_answer.toLowerCase().trim() === ansData.ans.toLowerCase().trim()) {
                                    score += 1;
                                }
                                break;
                            case 'fill-blanks':
                                if (actualQuestDt.correct_answers[0].toLowerCase().trim() === ansData.ans.toLowerCase().trim()) {
                                    score += 1;
                                }
                                break;
                            case 'match_pairs':
                                var currAns = [], actualAns = [];

                                actualQuestDt.correct_matches.forEach(dt => actualAns.push(JSON.stringify({ left_id: +dt.left_id, right_id: +dt.right_id })))

                                ansData.ans.forEach(dt => currAns.push(JSON.stringify(dt)))

                                if (actualAns.length === currAns.length && actualAns.every(item => currAns.includes(item))) {
                                    score += 1;
                                }
                                break;
                            case 'audio_sentence':
                                if (actualQuestDt.correct_answer_sequence.length === ansData.ans.length){
                                    console.log(actualQuestDt.correct_answer_sequence.join(','), '======', ansData.ans.join(','), '+++++++++++');
                                    
                                    if (actualQuestDt.correct_answer_sequence.map(dt => dt.toLowerCase()).join(',') === ansData.ans.join(',')){
                                        score += 1;
                                    }
                                }
                                break;
                            case 'describe-image':                                
                                if (actualQuestDt.correct_answer.toLowerCase().trim() === ansData.ans.toLowerCase().trim()) {
                                    score += 1;
                                }
                                break;
                        
                            default:
                                break;
                        }
                        // if(actualQuestDt.correct_answers[0].toLowerCase().trim() === ansData.ans.toLowerCase().trim()){
                        //     score += 1;
                        // }
                    }
                }
            }
        }
        res.send({suc: 1, msg: { score: score, total: total }});
        // console.log('Score:', score, 'Total:', total);
    }
})

module.exports = {quizWebRouter};