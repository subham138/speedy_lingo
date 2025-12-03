const dashboardRouter = require('express').Router();
const User = require('../../models/User');
const Question = require('../../models/Question');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');
const UserTransaction = require('../../models/UserTransaction');

dashboardRouter.get('/', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalQuestions = await Question.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalSubCategories = await SubCategory.countDocuments();
        const recentUsers = await User.find().sort({ created_dt: -1 }).limit(5);

        const successfulTransactions = await UserTransaction.find({ pay_status: 'paid' });
        const totalReceivedAmount = successfulTransactions.reduce((acc, curr) => acc + curr.received_amount, 0);
        const recentTransactions = await UserTransaction.find({ pay_status: 'paid' }).sort({ entry_dt: -1 }).limit(5);

        // Chart Data
        const days = [];
        const userCounts = [];
        const transactionAmounts = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

            const startOfDay = new Date(d);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(d);
            endOfDay.setHours(23, 59, 59, 999);

            const userCount = await User.countDocuments({
                created_dt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            });
            userCounts.push(userCount);

            const dailyTransactions = await UserTransaction.find({
                pay_status: 'paid',
                entry_dt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            });
            const dailyTotal = dailyTransactions.reduce((acc, curr) => acc + curr.received_amount, 0);
            transactionAmounts.push(dailyTotal);
        }

        res.render('admin/dashboard/index', {
            title: 'Admin Dashboard',
            totalUsers,
            totalQuestions,
            totalCategories,
            totalSubCategories,
            recentUsers,
            totalReceivedAmount,
            recentTransactions,
            chartData: {
                days,
                userCounts,
                transactionAmounts
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = { dashboardRouter };