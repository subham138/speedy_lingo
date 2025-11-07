const testHistoryRouter = require('express').Router();
const UserTestSession = require('../../models/UserTestSession');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');

testHistoryRouter.get('/', async (req, res) => {
    try {
        const user = req.user;

        // Get test history with category and subcategory names
        const testHistory = await UserTestSession.aggregate([
            {
                $match: {
                    user_id: user.id
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
                    subcategory: 0
                }
            },
            {
                $sort: {
                    end_time: -1
                }
            }
        ]);

        // Calculate statistics
        const totalTests = testHistory.length;
        const averageScore = totalTests > 0 ? Math.round(testHistory.reduce((sum, test) => sum + test.score_percentage, 0) / totalTests) : 0;
        const bestScore = totalTests > 0 ? Math.max(...testHistory.map(test => test.score_percentage)) : 0;
        const recentLevel = totalTests > 0 ? testHistory[0].cefr_level : 'A1';

        // Group by CEFR levels for chart
        const levelStats = {};
        testHistory.forEach(test => {
            levelStats[test.cefr_level] = (levelStats[test.cefr_level] || 0) + 1;
        });

        res.render('user/test-history', {
            title: 'Test History',
            testHistory: testHistory,
            stats: {
                totalTests,
                averageScore,
                bestScore,
                recentLevel,
                levelStats: JSON.stringify(levelStats)
            }
        });
    } catch (err) {
        console.log(err);
        res.render('user/test-history', {
            title: 'Test History',
            testHistory: [],
            stats: {
                totalTests: 0,
                averageScore: 0,
                bestScore: 0,
                recentLevel: 'A1',
                levelStats: JSON.stringify({})
            }
        });
    }
});

module.exports = { testHistoryRouter };
