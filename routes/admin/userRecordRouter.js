const express = require('express');
const userRecordRouter = express.Router();
const User = require('../../models/User');
const UserSubscription = require('../../models/UserSubscription');
const UserQuestionAnswer = require('../../models/UserQuestionAnswer');
const dateFormat = require('dateformat');

// Fetch and render user records page
userRecordRouter.get('/', async (req, res) => {
    try {
        res.render('admin/userRecords/index', { title: 'User Records' });
    } catch (error) {
        res.status(500).json({ message: 'Error loading user records', error: error.message });
    }
});

// API endpoint to fetch all users with subscription details
userRecordRouter.get('/api/all', async (req, res) => {
    try {
        const users = await User.find({ user_type: 'U' }).lean();

        const usersWithDetails = await Promise.all(
            users.map(async (user) => {
                // Fetch latest subscription
                const subscription = await UserSubscription.findOne({ user_id: user.id })
                    .sort({ purchase_date: -1 })
                    .lean();

                // Count total activities
                const activityCount = await UserQuestionAnswer.countDocuments({ user_id: user.id });

                return {
                    ...user,
                    isSubscribed: subscription && subscription.status === 'active' ? 'Yes' : 'No',
                    subscriptionPlan: subscription?.product_name || 'N/A',
                    planType: subscription?.month_yearly || 'N/A',
                    expiryDate: subscription?.expires_date ? dateFormat(subscription.expires_date, 'dd-mm-yyyy') : 'N/A',
                    lastActivity: user.last_login ? dateFormat(user.last_login, 'dd-mm-yyyy hh:MM:ss') : 'No activity',
                    totalActivities: activityCount,
                    accountStatus: user.active_flag === 'Y' ? 'Active' : 'Inactive',
                    joinDate: dateFormat(user.created_dt, 'dd-mm-yyyy')
                };
            })
        );

        res.status(200).json(usersWithDetails);
    } catch (error) {
        console.error('Error fetching user records:', error);
        res.status(500).json({ message: 'Error fetching user records', error: error.message });
    }
});

// API endpoint to fetch single user details
userRecordRouter.get('/api/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ id: req.params.userId }).lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch all subscriptions for this user
        const subscriptions = await UserSubscription.find({ user_id: user.id })
            .sort({ purchase_date: -1 })
            .lean();

        // Count activities
        const activityCount = await UserQuestionAnswer.countDocuments({ user_id: user.id });

        const userDetails = {
            ...user,
            isSubscribed: subscriptions.length > 0 && subscriptions[0].status === 'active' ? 'Yes' : 'No',
            currentPlan: subscriptions[0] || null,
            allSubscriptions: subscriptions,
            accountStatus: user.active_flag === 'Y' ? 'Active' : 'Inactive',
            planStatus: user.plan_is_active === 'Y' ? 'Active' : 'Inactive',
            totalActivities: activityCount,
            joinDate: dateFormat(user.created_dt, 'dd-mm-yyyy'),
            lastActivity: user.last_login ? dateFormat(user.last_login, 'dd-mm-yyyy hh:MM:ss') : 'No activity'
        };

        res.status(200).json(userDetails);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Error fetching user details', error: error.message });
    }
});

module.exports = { userRecordRouter };