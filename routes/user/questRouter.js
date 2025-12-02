const Category = require('../../models/Category');
const Question = require('../../models/Question');
const SubCategory = require('../../models/SubCategory');
const UserQuestAns = require('../../models/UserQuestionAnswer');
const UserTestSession = require('../../models/UserTestSession');
const dateFormat = require('dateformat');
const { shuffleOptions } = require('../../modules/masterModules');
const StripeProduct = require('../../models/Products');
const { generateQuestions, generateAllQuestions, getTotalQuestionsTypeWise, getTotalAnsQuestionsList } = require('../../modules/questionModules');
const userProgress = require('../../models/userProgress');

const questRouter = require('express').Router();

questRouter.get('/level', async (req, res) => {
    const data = req.query, user = req.user;
    const SubCatgName = await SubCategory.findOne({ id: data.sub_catg_id });
    var userTotalAnswered = 10;
    var userProg = {
        readingBeg: 0,
        readingInt: 0,
        readingAdv: 0,
        listeningBrg: 0,
        listeningInt: 0,
        listeningAdv: 0
    }

    if (user.plan_is_active != 'Y'){
        const lastQuestSet = await userProgress.find({ user_id: user.id, catg_id: +data.catg_id, sub_catg_id: +data.sub_catg_id });
        if (lastQuestSet && lastQuestSet.length > 0){
            var quest_arr = [];
            lastQuestSet.forEach(ls => {
                quest_arr = quest_arr.concat(ls.last_question_ids);
            });

            var totalQuestionsByType = {msg: {
                readingTotalQuestionBeg: userTotalAnswered,
                readingTotalQuestionInt: userTotalAnswered,
                readingTotalQuestionAdv: userTotalAnswered,
                listeningTotalQuestionBrg: userTotalAnswered,
                listeningTotalQuestionInt: userTotalAnswered,
                listeningTotalQuestionAdv: userTotalAnswered
            }};
            var totalAnswerd = await getTotalAnsQuestionsList(user.id, false, quest_arr);

            userProg = {
                readingBeg: Math.floor((totalAnswerd.msg.readingTotalUserAnsBeg / totalQuestionsByType.msg.readingTotalQuestionBeg) * 100) || 0,
                readingInt: Math.floor((totalAnswerd.msg.readingTotalUserAnsInt / totalQuestionsByType.msg.readingTotalQuestionInt) * 100) || 0,
                readingAdv: Math.floor((totalAnswerd.msg.readingTotalUserAnsAdv / totalQuestionsByType.msg.readingTotalQuestionAdv) * 100) || 0,
                listeningBrg: Math.floor((totalAnswerd.msg.listeningTotalUserAnsBrg / totalQuestionsByType.msg.listeningTotalQuestionBrg) * 100) || 0,
                listeningInt: Math.floor((totalAnswerd.msg.listeningTotalUserAnsInt / totalQuestionsByType.msg.listeningTotalQuestionInt) * 100) || 0,
                listeningAdv: Math.floor((totalAnswerd.msg.listeningTotalUserAnsAdv / totalQuestionsByType.msg.listeningTotalQuestionAdv) * 100) || 0
            }
        }
    }else{
        var totalQuestionsByType = await getTotalQuestionsTypeWise(+data.catg_id, +data.sub_catg_id);
        var totalAnswerd = await getTotalAnsQuestionsList(user.id, true);

        userProg = {
            readingBeg: Math.floor((totalAnswerd.msg.readingTotalUserAnsBeg / totalQuestionsByType.msg.readingTotalQuestionBeg) * 100) || 0,
            readingInt: Math.floor((totalAnswerd.msg.readingTotalUserAnsInt / totalQuestionsByType.msg.readingTotalQuestionInt) * 100) || 0,
            readingAdv: Math.floor((totalAnswerd.msg.readingTotalUserAnsAdv / totalQuestionsByType.msg.readingTotalQuestionAdv) * 100) || 0,
            listeningBrg: Math.floor((totalAnswerd.msg.listeningTotalUserAnsBrg / totalQuestionsByType.msg.listeningTotalQuestionBrg) * 100) || 0,
            listeningInt: Math.floor((totalAnswerd.msg.listeningTotalUserAnsInt / totalQuestionsByType.msg.listeningTotalQuestionInt) * 100) || 0,
            listeningAdv: Math.floor((totalAnswerd.msg.listeningTotalUserAnsAdv / totalQuestionsByType.msg.listeningTotalQuestionAdv) * 100) || 0
        }

    }    

    data.subcategory_name = SubCatgName.name;
    res.render('user/question/questionLevel', { title: 'Question Level', queryData: data, userProg });
})

questRouter.get('/question', async (req, res) => {
    const encDt = req.query;
    let data = Buffer.from(encDt.enc_dt, 'base64').toString('ascii');
    data = JSON.parse(data);
    const user = req.user;

    // console.log(user, 'USer data');

    var totalQuestionsAllowed = user.plan_is_active != 'Y' ? 10 : 0;

    if (user && user.plan_is_active != 'N') {
        const allowedQuestions = await StripeProduct.findOne({ id: user.active_pan_id });
        if (allowedQuestions) totalQuestionsAllowed = allowedQuestions.allowed_question || 0;
    }

    if (!totalQuestionsAllowed || totalQuestionsAllowed <= 0) totalQuestionsAllowed = 10;

    const filterParams = data.quest_type == 'learning' ? ['select_correct', 'fill_in_blanks', 'match_pairs'] : (data.quest_type == 'listening' ? ['describe_image', 'audio_sentence'] : [])

    const CatgName = await Category.findOne({ id: data.catg_id });
    const SubCatgName = await SubCategory.findOne({ id: data.sub_catg_id });

    data.category_name = CatgName.name;
    data.subcategory_name = SubCatgName.name;


    const questionData = totalQuestionsAllowed > 10 ? await generateAllQuestions(user.id, data) : await generateQuestions(user.id, data, totalQuestionsAllowed);

    res.render('user/question/questions', {
        title: 'Question',
        data: questionData.msg,
        shuffle: shuffleOptions,
        last_ans_quest_index: data.last_ans_quest_index,
        allowQuestLeng: totalQuestionsAllowed
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
                                    if (actualQuestDt.correct_answer_sequence.map(dt => dt.toLowerCase()).join(',') === ansData.ans.join(',')) {
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
                            console.log(err);

                            return res.send({ suc: 0, msg: err });
                        }
                    }
                }
            }
        }

        res.send({ suc: 1, msg: "Question Saved Successfully", results: results, score: correctAnswers, total: totalQuestions });
        // console.log('Score:', score, 'Total:', total);
    } else {
        res.send({ suc: 0, msg: "No answer found" })
    }
})

module.exports = { questRouter };