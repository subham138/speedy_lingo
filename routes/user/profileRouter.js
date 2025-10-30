const profileRouter = require('express').Router();
const User = require('../../models/User');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

profileRouter.get('/', async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.user.user_id });
        res.render('user/profile/updateProfile', { title: 'User Profile', user: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        req.session.message = { type: 'error', title: 'Error', msg: 'Failed to load profile' };
        res.redirect('/user/dashboard');
    }
})

profileRouter.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.user.user_id;

        let profileImagePath = null;

        // Handle file upload
        if (req.files && req.files.profile_image) {
            const profileImage = req.files.profile_image;
            const uploadDir = path.join(__dirname, '../../assets/uploads/profiles/');

            // Ensure upload directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Generate unique filename
            const fileExt = path.extname(profileImage.name);
            const fileName = `${userId}_${Date.now()}${fileExt}`;
            const filePath = path.join(uploadDir, fileName);

            // Move file to upload directory
            await profileImage.mv(filePath);
            profileImagePath = `/uploads/profiles/${fileName}`;
        }

        // Update user data
        const updateData = { name, phone };
        if (profileImagePath) {
            updateData.profile_image = profileImagePath;
        }

        await User.findOneAndUpdate(
            { user_id: userId },
            updateData,
            { new: true }
        );

        req.session.message = { type: 'success', title: 'Success', msg: 'Profile updated successfully' };
        res.redirect('/user/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.session.message = { type: 'error', title: 'Error', msg: 'Failed to update profile' };
        res.redirect('/user/profile');
    }
});

profileRouter.get('/change_password', async (req, res) => {
    res.render('user/profile/changePassword', { title: 'Change Password' });
})

profileRouter.post('/change_password', async (req, res) => {
    try {
        const { old_password, new_password, confirm_password } = req.body;
        const userId = req.user.user_id;

        // Validate input
        if (new_password !== confirm_password) {
            req.session.message = { type: 'error', title: 'Error', msg: 'New passwords do not match' };
            return res.redirect('/user/profile/change_password');
        }

        if (new_password.length < 6) {
            req.session.message = { type: 'error', title: 'Error', msg: 'New password must be at least 6 characters long' };
            return res.redirect('/user/profile/change_password');
        }

        // Find user
        const user = await User.findOne({ user_id: userId });
        if (!user) {
            req.session.message = { type: 'error', title: 'Error', msg: 'User not found' };
            return res.redirect('/user/profile/change_password');
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(old_password, user.password);
        if (!isOldPasswordValid) {
            req.session.message = { type: 'error', title: 'Error', msg: 'Old password is incorrect' };
            return res.redirect('/user/profile/change_password');
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        // Update password
        await User.findOneAndUpdate(
            { user_id: userId },
            { password: hashedNewPassword },
            { new: true }
        );

        req.session.message = { type: 'success', title: 'Success', msg: 'Password changed successfully' };
        res.redirect('/user/profile');
    } catch (error) {
        console.error('Error changing password:', error);
        req.session.message = { type: 'error', title: 'Error', msg: 'Failed to change password' };
        res.redirect('/user/profile/change_password');
    }
});

module.exports = { profileRouter };
