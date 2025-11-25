const Category = require('../../models/Category');
const Question = require('../../models/Question');
const SubCategory = require('../../models/SubCategory');
const UserQuestAns = require('../../models/UserQuestionAnswer');
const UserTestSession = require('../../models/UserTestSession');
const dateFormat = require('dateformat');
const { shuffleOptions } = require('../../modules/masterModules');

const questRouter = require('express').Router();

questRouter.get('/level', async (req, res) => {
    const data = req.query;
    res.render('user/question/questionLevel', { title: 'Question Level', queryData: data });
})

questRouter.get('/question', async (req, res) => {
    const encDt = req.query;
    let data = Buffer.from(encDt.enc_dt, 'base64').toString('ascii');
    data = JSON.parse(data);
    const user = req.user;

    const filterParams = data.quest_type == 'learning' ? ['select_correct', 'fill_in_blanks', 'match_pairs'] : (data.quest_type == 'listening' ? ['describe_image', 'audio_sentence'] : [])

    const CatgName = await Category.findOne({ id: data.catg_id });
    const SubCatgName = await SubCategory.findOne({ id: data.sub_catg_id });

    data.category_name = CatgName.name;
    data.subcategory_name = SubCatgName.name;


    const questionListRaw = await Question.aggregate([
        {
            $match: {
                question_display_in: 'inside',
                category_id: +data.catg_id,
                sub_category_id: +data.sub_catg_id,
                question_level: data.level,
                active_flag: 'Y',
                question_type: { $in: filterParams }
            }
        },
        {
            $lookup: {
                from: "md_category",
                localField: "category_id",
                foreignField: "id",
                as: "category"
            }
        },
        {
            $lookup: {
                from: "md_sub_category",
                localField: "sub_category_id",
                foreignField: "id",
                as: "subcategory"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$subcategory",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                category_name: "$category.name",
                subcategory_name: "$subcategory.name"
            }
        },
        {
            $project: {
                category: 0,
                subcategory: 0,
                category_id: 0,
                sub_category_id: 0
            }
        },
        { $sort: { category_id: 1, id: 1 } },
    ]);
    var questionList = questionListRaw;

    // console.log(questionList, 'List');
    

    // fetch user's saved answers for these questions
    const questionIds = questionList.map(q => q.id);
    let userAnswers = [], answeredQuestionId = [];
    if (user) {
        userAnswers = await UserQuestAns.find({ user_id: user.id, quest_id: { $in: questionIds } });
    }

    // map user answers to question list items
    questionList = questionList.map(q => {
        const savedAns = userAnswers.find(ans => ans.quest_id === q.id);
        if (savedAns)
            answeredQuestionId.push(q.id)
        return {
            ...q,
            userAnswer: savedAns ? savedAns.answer : null,
            isCorrect: savedAns ? savedAns.is_correct : null,
            isSkipped: savedAns ? (savedAns.answer === null || savedAns.answer === '') : true
        };
    });
    // console.log(questionList);
    

    data.questionList = questionList;

    // max question id index
    var lastAnswerdQuestionIndex = answeredQuestionId.length > 0 ? questionList.findIndex(dt => dt.id == Math.max(...answeredQuestionId)) : -1

    res.render('user/question/questions', { 
        title: 'Question', 
        data: data,
        shuffle: shuffleOptions,
        last_ans_quest_index: lastAnswerdQuestionIndex,
        allowQuestLeng: 10
    });
})

questRouter.post('/question_save', async (req, res) => {
    const data = req.body,
        user = req.user;

    // console.log(JSON.stringify(data), 'Request Data');
    

    let results = [];
    let totalQuestions = 0;
    let correctAnswers = 0;
    const startTime = new Date(data.start_time || new Date());

    if (data && data.answers) {
        if (Object.keys(data.answers).length > 0) {
            for (const qtype in data.answers) {
                console.log(qtype);
                for (const qnum in data.answers[qtype]) {
                    const ansData = data.answers[qtype][qnum];
                    console.log(ansData, 'ansData');
                    
                    let actualQuestDt = await Question.findOne({ id: ansData.qId });
                    let score = false;
                    totalQuestions++;

                    if (actualQuestDt) {
                        // console.log(actualQuestDt.correct_answers[0].toLowerCase().trim(), '++__++', ansData.ans.toLowerCase().trim());
                        switch (qtype) {
                            case 'select-correct':
                                if (actualQuestDt.correct_answer.toLowerCase().trim() === ansData.ans.toLowerCase().trim()) {
                                    score = true;
                                    correctAnswers++;
                                }
                                break;
                            case 'fill-blanks':
                                if (actualQuestDt.correct_answers[0].toLowerCase().trim() === ansData.ans.toLowerCase().trim()) {
                                    score = true;
                                    correctAnswers++;
                                }
                                break;
                            case 'match_pairs':
                                var currAns = [], actualAns = [];

                                actualQuestDt.correct_matches.forEach(dt => actualAns.push(JSON.stringify({ left_id: +dt.left_id, right_id: +dt.right_id })))

                                ansData.ans.forEach(dt => currAns.push(JSON.stringify(dt)))

                                if (actualAns.length === currAns.length && actualAns.every(item => currAns.includes(item))) {
                                    score = true;
                                    correctAnswers++;
                                }
                                break;
                            case 'audio_sentence':
                                if (actualQuestDt.correct_answer_sequence.length === ansData.ans.length) {
                                    if (actualQuestDt.correct_answer_sequence.join(',') === ansData.ans.join(',')) {
                                        score = true;
                                        correctAnswers++;
                                    }
                                }
                                break;
                            case 'describe-image':
                                if (actualQuestDt.correct_answer.toLowerCase().trim() === ansData.ans.toLowerCase().trim()) {
                                    score = true;
                                    correctAnswers++;
                                }
                                break;

                            default:
                                break;
                        }
                        var chkUserAns = await UserQuestAns.findOne({ user_id: user.id, quest_id: ansData.qId })
                        try {
                            if (chkUserAns) {
                                await UserQuestAns.updateOne({ id: chkUserAns.id }, {
                                    $set: {
                                        answer: ansData.ans,
                                        is_correct: score,
                                        modified_by: user.name,
                                        modified_dt: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                    }
                                })
                            } else {
                                await UserQuestAns.create({
                                    user_id: user.id,
                                    entry_dt: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                                    quest_id: ansData.qId,
                                    answer: ansData.ans,
                                    is_correct: score,
                                    created_by: user.name,
                                    created_dt: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
                                })
                            }
                            results.push({ qnum: parseInt(qnum), is_correct: score });
                            // return res.send({ suc: 1, msg: "Question Saved Successfully", results: results, score: correctAnswers, total: totalQuestions });
                        } catch (err) {
                            return res.send({ suc: 0, msg: err });
                        }
                    }
                }
            }
        }

        res.send({ suc: 1, msg: "Question Saved Successfully", results: results, score: correctAnswers, total: totalQuestions });
        // console.log('Score:', score, 'Total:', total);
    }else{
        res.send({suc: 0, msg: "No answer found"})
    }
})

module.exports = { questRouter };