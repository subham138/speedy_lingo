const Question = require("../models/Question");
const userProgress = require("../models/userProgress");
const UserQuestAns = require("../models/UserQuestionAnswer");

function isSameIstDay(d1, d2) {
    if (!d1 || !d2) return false;
    const IST_OFFSET_MIN = 5 * 60 + 30; // +5:30 in minutes
    const s1 = new Date(d1.getTime() + IST_OFFSET_MIN * 60000);
    const s2 = new Date(d2.getTime() + IST_OFFSET_MIN * 60000);
    return s1.getUTCFullYear() === s2.getUTCFullYear() &&
        s1.getUTCMonth() === s2.getUTCMonth() &&
        s1.getUTCDate() === s2.getUTCDate();
}

const generateQuestions = (user_id, data, totalQuestionsAllowed) => {
    return new Promise(async (resolve, reject) => {
        try {
            const filterParams = data.quest_type == 'learning' ? ['select_correct', 'fill_in_blanks', 'match_pairs'] : (data.quest_type == 'listening' ? ['describe_image', 'audio_sentence'] : [])

            const now = new Date();
            let progress = null;
            let lastQuestionIds = [];
            if (user_id) {
                progress = await userProgress.findOne({ user_id: user_id, catg_id: +data.catg_id, sub_catg_id: +data.sub_catg_id, level: data.level }).lean().exec();
                if (progress && progress.last_set_at) {
                    // const diffMs = now - new Date(progress.last_set_at);
                    if (isSameIstDay(new Date(progress.last_set_at), now) && Array.isArray(progress.last_question_ids) && progress.last_question_ids.length > 0) {
                        // within 24 hours: return the cached set (but ensure it still matches base filters)
                        lastQuestionIds = progress.last_question_ids.slice(0, totalQuestionsAllowed);

                        // fetch the full question docs for these ids in the same shape you expect
                        const questionListRaw = await Question.aggregate([
                            {
                                $match: {
                                    question_display_in: 'inside',
                                    category_id: +data.catg_id,
                                    sub_category_id: +data.sub_catg_id,
                                    question_level: data.level,
                                    active_flag: 'Y',
                                    question_type: { $in: filterParams },
                                    id: { $in: lastQuestionIds } // numeric id
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
                            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                            { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
                            { $addFields: { category_name: "$category.name", subcategory_name: "$subcategory.name" } },
                            { $project: { category: 0, subcategory: 0, category_id: 0, sub_category_id: 0 } }
                        ]).exec();

                        // preserve the order of lastQuestionIds
                        const ordered = lastQuestionIds.map(id => questionListRaw.find(q => q.id === id)).filter(Boolean);

                        // fetch user's saved answers for these questions (as your original code)
                        const questionIds = ordered.map(q => q.id);
                        let userAnswers = [], answeredQuestionId = [];
                        if (user_id) {
                            userAnswers = await UserQuestAns.find({ user_id: user_id, quest_id: { $in: questionIds } }).lean().exec();
                        }

                        const questionList = ordered.map(q => {
                            const savedAns = userAnswers.find(ans => ans.quest_id === q.id);
                            if (savedAns) answeredQuestionId.push(q.id);
                            return {
                                ...q,
                                userAnswer: savedAns ? savedAns.answer : null,
                                isCorrect: savedAns ? savedAns.is_correct : null,
                                isSkipped: savedAns ? (savedAns.answer === null || savedAns.answer === '') : true
                            };
                        });

                        data.questionList = questionList;
                        var lastAnswerdQuestionIndex = answeredQuestionId.length > 0 ? questionList.findIndex(dt => dt.id == Math.max(...answeredQuestionId)) : -1;

                        return resolve({ suc: 1, msg: data, last_ans_quest_index: lastAnswerdQuestionIndex })
                    }
                    // else fall-through to build a new set
                    lastQuestionIds = progress.last_question_ids || [];
                }
            }

            // --- Build a new set (not cached or cache expired) ---
            // Exclude the immediate previous set to avoid repeats
            const excludeIds = Array.isArray(lastQuestionIds) ? lastQuestionIds : [];

            // Step 1: try to pick one per type from filterParams (if available), excluding excludeIds
            const selectedIds = [];
            for (const t of filterParams) {
                // Aggregation to sample one id
                const one = await Question.aggregate([
                    {
                        $match: {
                            question_display_in: 'inside',
                            category_id: +data.catg_id,
                            sub_category_id: +data.sub_catg_id,
                            question_level: data.level,
                            active_flag: 'Y',
                            question_type: t,
                            id: { $nin: excludeIds.concat(selectedIds) }
                        }
                    },
                    { $sample: { size: 1 } },
                    { $project: { id: 1 } }
                ]).exec();
                if (one && one.length > 0) selectedIds.push(one[0].id);
            }

            // Step 2: fill remaining slots with random questions across allowed types, excluding excludeIds and selectedIds
            const remaining = Math.max(0, totalQuestionsAllowed - selectedIds.length);
            if (remaining > 0) {
                const more = await Question.aggregate([
                    {
                        $match: {
                            question_display_in: 'inside',
                            category_id: +data.catg_id,
                            sub_category_id: +data.sub_catg_id,
                            question_level: data.level,
                            active_flag: 'Y',
                            question_type: { $in: filterParams },
                            id: { $nin: excludeIds.concat(selectedIds) }
                        }
                    },
                    { $sample: { size: remaining } },
                    { $project: { id: 1 } }
                ]).exec();
                for (const m of more) selectedIds.push(m.id);
            }

            // Step 3: fallback - if still less than required, allow picking ignoring excludeIds (DB small)
            if (selectedIds.length < totalQuestionsAllowed) {
                const need = totalQuestionsAllowed - selectedIds.length;
                const fallback = await Question.aggregate([
                    {
                        $match: {
                            question_display_in: 'inside',
                            category_id: +data.catg_id,
                            sub_category_id: +data.sub_catg_id,
                            question_level: data.level,
                            active_flag: 'Y',
                            question_type: { $in: filterParams },
                            id: { $nin: selectedIds } // only avoid duplicates inside this run
                        }
                    },
                    { $sample: { size: need } },
                    { $project: { id: 1 } }
                ]).exec();
                for (const f of fallback) selectedIds.push(f.id);
            }

            // final selectedIds holds numeric question ids; preserve order as built
            // Fetch full question docs for selectedIds using your same pipeline (so lookup/unwind/project fields match)
            const questionListRaw = await Question.aggregate([
                {
                    $match: {
                        question_display_in: 'inside',
                        category_id: +data.catg_id,
                        sub_category_id: +data.sub_catg_id,
                        question_level: data.level,
                        active_flag: 'Y',
                        question_type: { $in: filterParams },
                        id: { $in: selectedIds }
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
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$subcategory", preserveNullAndEmptyArrays: true } },
                { $addFields: { category_name: "$category.name", subcategory_name: "$subcategory.name" } },
                { $project: { category: 0, subcategory: 0, category_id: 0, sub_category_id: 0 } }
            ]).exec();

            // preserve the earlier selectedIds order
            const ordered = selectedIds.map(id => questionListRaw.find(q => q.id === id)).filter(Boolean);

            // fetch user's saved answers for these questions (as your original code)
            const questionIds = ordered.map(q => q.id);
            let userAnswers = [], answeredQuestionId = [];
            if (user_id) {
                userAnswers = await UserQuestAns.find({ user_id: user_id, quest_id: { $in: questionIds } }).lean().exec();
            }

            const questionList = ordered.map(q => {
                const savedAns = userAnswers.find(ans => ans.quest_id === q.id);
                if (savedAns) answeredQuestionId.push(q.id);
                return {
                    ...q,
                    userAnswer: savedAns ? savedAns.answer : null,
                    isCorrect: savedAns ? savedAns.is_correct : null,
                    isSkipped: savedAns ? (savedAns.answer === null || savedAns.answer === '') : true
                };
            });

            data.questionList = questionList;
            var lastAnswerdQuestionIndex = answeredQuestionId.length > 0 ? questionList.findIndex(dt => dt.id == Math.max(...answeredQuestionId)) : -1;

            // Save/update user progress: store numeric ids and timestamp
            if (user_id) {
                const upsert = {
                    user_id: user_id,
                    last_set_at: now,
                    last_question_ids: selectedIds,
                    catg_id: +data.catg_id,
                    sub_catg_id: +data.sub_catg_id,
                    level: data.level
                };
                // also add to history (optional)
                await userProgress.findOneAndUpdate(
                    { user_id: upsert.user_id, catg_id: upsert.catg_id, sub_catg_id: upsert.sub_catg_id, level: upsert.level },
                    { $set: { last_set_at: upsert.last_set_at, last_question_ids: upsert.last_question_ids }, $push: { history: { $each: selectedIds.map(id => ({ question_id: id, shown_at: now })) } } },
                    { upsert: true, new: true }
                ).exec();
            }
            return resolve({ suc: 1, msg: data, last_ans_quest_index: lastAnswerdQuestionIndex })
        } catch (err) {
            console.log(err);

            data.questionList = [];
            return resolve({ suc: 0, msg: data, last_ans_quest_index: 0 });
            // return resolve({suc:0, msg:"Error occurred while generating questions."});
        }
    })
}

const generateAllQuestions = (user_id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
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
            if (user_id) {
                userAnswers = await UserQuestAns.find({ user_id: user_id, quest_id: { $in: questionIds } });
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

            resolve({ suc: 1, msg: data, last_ans_quest_index: lastAnswerdQuestionIndex })
        } catch (err) {
            data.questionList = [];
            return resolve({ suc: 0, msg: data, last_ans_quest_index: 0 });
        }
    })
}

const getTotalQuestionsTypeWise = (catg_id, sub_catg_id) => {
    return new Promise(async (resolve, reject) => {
        var result = {
            readingTotalQuestionBeg: 0,
            readingTotalQuestionInt: 0,
            readingTotalQuestionAdv: 0,
            listeningTotalQuestionBrg: 0,
            listeningTotalQuestionInt: 0,
            listeningTotalQuestionAdv: 0
        }
        try {
            const totalQuestionsByType = await Question.aggregate([
                {
                    $match: {
                        category_id: catg_id,
                        sub_category_id: sub_catg_id
                    }
                },
                {
                    $group: {
                        _id: {
                            question_level: "$question_level",
                            question_type: "$question_type"
                        },
                        tot_question: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        question_level: "$_id.question_level",
                        question_type: "$_id.question_type",
                        tot_question: 1
                    }
                }
            ]);

            if (totalQuestionsByType.length > 0) {
                result.readingTotalQuestionBeg = totalQuestionsByType
                    .filter(dt => ['select_correct', 'fill_in_blanks', 'match_pairs'].includes(dt.question_type) && dt.question_level == 'beginner')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.readingTotalQuestionInt = totalQuestionsByType
                    .filter(dt => ['select_correct', 'fill_in_blanks', 'match_pairs'].includes(dt.question_type) && dt.question_level == 'intermediate')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.readingTotalQuestionAdv = totalQuestionsByType
                    .filter(dt => ['select_correct', 'fill_in_blanks', 'match_pairs'].includes(dt.question_type) && dt.question_level == 'advanced')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);


                result.listeningTotalQuestionBrg = totalQuestionsByType
                    .filter(dt => ['describe_image', 'audio_sentence'].includes(dt.question_type) && dt.question_level == 'beginner')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.listeningTotalQuestionInt = totalQuestionsByType
                    .filter(dt => ['describe_image', 'audio_sentence'].includes(dt.question_type) && dt.question_level == 'intermediate')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.listeningTotalQuestionAdv = totalQuestionsByType
                    .filter(dt => ['describe_image', 'audio_sentence'].includes(dt.question_type) && dt.question_level == 'advanced')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                resolve({ suc: 1, msg: result });
            } else {
                resolve({ suc: 0, msg: result });
            }
        } catch (err) {
            console.log(err, 'Errror in getTotalQuestionsTypeWise');
            resolve({ suc: 0, msg: result });
        }
    })
}

const getTotalAnsQuestionsList = (user_id, is_all = true, quest_arr = []) => {
    return new Promise(async (resolve, reject) => {
        var result = {
            readingTotalUserAnsBeg: 0,
            readingTotalUserAnsInt: 0,
            readingTotalUserAnsAdv: 0,
            listeningTotalUserAnsBrg: 0,
            listeningTotalUserAnsInt: 0,
            listeningTotalUserAnsAdv: 0
        }
        try {
            var match = {}
            if (is_all) {
                match = {
                    user_id: user_id.toString(),
                }
            } else {
                match = {
                    user_id: user_id.toString(),
                    quest_id: { $in: quest_arr }
                }
            }
            var userResultDt = await UserQuestAns.aggregate([
                {
                    $match: match
                },
                {
                    $lookup: {
                        from: "md_question_answer",   // second collection name (same as MySQL)
                        localField: "quest_id",       // from td_user_quest_answer
                        foreignField: "id",           // matches md_question_answer.id
                        as: "question"
                    }
                },
                { $unwind: "$question" },
                {
                    $group: {
                        _id: {
                            question_level: "$question.question_level",
                            question_type: "$question.question_type"
                        },
                        tot_question: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        question_level: "$_id.question_level",
                        question_type: "$_id.question_type",
                        tot_question: 1
                    }
                }
            ])

            if (userResultDt.length > 0) {
                result.readingTotalUserAnsBeg = userResultDt
                    .filter(dt => ['select_correct', 'fill_in_blanks', 'match_pairs'].includes(dt.question_type) && dt.question_level == 'beginner')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.readingTotalUserAnsInt = userResultDt
                    .filter(dt => ['select_correct', 'fill_in_blanks', 'match_pairs'].includes(dt.question_type) && dt.question_level == 'intermediate')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.readingTotalUserAnsAdv = userResultDt
                    .filter(dt => ['select_correct', 'fill_in_blanks', 'match_pairs'].includes(dt.question_type) && dt.question_level == 'advanced')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);


                result.listeningTotalUserAnsBrg = userResultDt
                    .filter(dt => ['describe_image', 'audio_sentence'].includes(dt.question_type) && dt.question_level == 'beginner')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.listeningTotalUserAnsInt = userResultDt
                    .filter(dt => ['describe_image', 'audio_sentence'].includes(dt.question_type) && dt.question_level == 'intermediate')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                result.listeningTotalUserAnsAdv = userResultDt
                    .filter(dt => ['describe_image', 'audio_sentence'].includes(dt.question_type) && dt.question_level == 'advanced')
                    .reduce((sum, dt) => sum + dt.tot_question, 0);
                resolve({ suc: 1, msg: result });
            } else {
                resolve({ suc: 0, msg: result });
            }
        } catch (err) {
            console.log(err, 'Errror in getTotalAnsQuestionsList');
            resolve({ suc: 0, msg: result });
        }
    })
}

module.exports = {
    generateQuestions, generateAllQuestions, getTotalQuestionsTypeWise, getTotalAnsQuestionsList
};