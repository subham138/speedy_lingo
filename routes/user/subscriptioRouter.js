const subscriptionRouter = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const UserSubscription = require('../../models/UserSubscription');
const { createToken } = require('../../middleware/authMiddleware');
const User = require('../../models/User');
const dateFormat = require('dateformat');
const StripeProduct = require('../../models/Products');
const { saveTransaction } = require('../../modules/stripeWebhookModule');

subscriptionRouter.get('/', async (req, res) => {
    const user = req.user
    const userDtls = await UserSubscription.findOne({ user_id: user.id }).sort({ created_dt: 1 }),
        publishable_key = process.env.STRIPE_PUBLISHABLE_KEY,
        pricing_table_id = process.env.STRIPE_PRICING_TABLE_ID;
    console.log(userDtls);

    if (userDtls && Object.keys(userDtls).length > 0) {
        // The URL where the user will be redirected when they click "Return to site" in the Portal
        const returnUrl = `${process.env.BASE_URL}/logout`;
        const customerId = userDtls.stripe_customer_id;
        try {
            // 1. Create the Portal Session
            const session = await stripe.billingPortal.sessions.create({
                customer: customerId, // Use the Customer ID you stored after payment
                return_url: returnUrl,
            });

            // 2. Redirect the user's browser to the Stripe-hosted portal URL
            return res.redirect(303, session.url);

        } catch (error) {
            console.error('Error creating portal session:', error);
            // return res.status(500).send('Unable to access customer portal.');
        }
    }

    res.render('user/subscription/view', {
        title: 'Subscription', publishable_key, pricing_table_id });
})

subscriptionRouter.get('/process', async (req, res) => {
    // console.log('Another', req.query);

    const sessionId = req.query.session_id,
        plan = new Buffer.from(decodeURIComponent(req.query.product), 'base64').toString(),
        user = req.user,
        month_yearly = new Buffer.from(decodeURIComponent(req.query.myear), 'base64').toString(),
        currDate = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
    });

    // console.log(session, 'SESSION');
    // return res.send(session)


    // 2. Check the payment status
    if (session.payment_status === 'paid' && session.status === 'complete') {
        const customerId = session.customer ? session.customer.id : 'N/A';
        const paymentIntentId = session.payment_intent || 'N/A';
        const subscriptionId = session.subscription ? session.subscription.id : 'N/A';
        const customerEmail = session.customer_details.email;

        const purchaseDate = new Date(session.subscription?.start_date * 1000);
        const expireDate = new Date(purchaseDate);

        const planDtls = await StripeProduct.findOne({ stripe_product_id: session.subscription.plan.product });

        const plan_id = planDtls ? (planDtls.id ? planDtls.id : 0) : 0,
            prod_name = planDtls ? (planDtls.plan_name ? planDtls.plan_name : '') : '';
        // const month_yearly = session.subscription.plan.interval;

        if (month_yearly === "Month") {
            expireDate.setMonth(expireDate.getMonth() + 1);
        } else if (month_yearly === "Yearly") {
            expireDate.setFullYear(expireDate.getFullYear() + 1);
        }

        const purchased = purchaseDate.toLocaleString("en-CA", { hour12: false }).replace(",", "");
        const expired = expireDate.toLocaleString("en-CA", { hour12: false }).replace(",", "");

        var chk_subs = await UserSubscription.findOne({ stripe_subscription_id: session.subscription.id, status: { $ne: 'canceled' } }, 'id, user_id');

        const user_id = chk_subs ? (chk_subs.user_id ? chk_subs.user_id : user.id) : user.id;
        if (chk_subs && Object.keys(chk_subs).length > 0) {
            await UserSubscription.updateOne({ stripe_subscription_id: session.subscription.id }, {
                $set: {
                    status: 'canceled',
                    modified_by: 'stripe-update-webhook',
                    modified_dt: currDate,
                }
            })
        }

        // Save subscription data
        try {
            const subscriptionData = {
                user_id: user_id,
                product_name: prod_name,
                month_yearly: session.subscription.plan.interval,
                stripe_product_id: session.subscription.plan.product,
                stripe_plan_id: session.subscription.plan.id,
                purchase_date: purchased,
                expires_date: expired,
                stripe_subscription_id: session.subscription.id,
                stripe_customer_id: customerId,
                amount: session.amount_total / 100,
                currency: session.currency,
                status: session.payment_status,
                full_json: JSON.stringify(session),
                created_by: user.name,
                created_dt: currDate,
            }

            const newUserSubscription = new UserSubscription(subscriptionData);
            var saveSubsData = await newUserSubscription.save();
            if (saveSubsData) {
                // Update user with stripe customer id and update cookie
                if (user && user.id && customerId !== 'N/A') {
                    try {
                        const updatedUser = await User.updateOne({ id: user.id },
                            {
                                $set: {
                                    stripe_customer_id: customerId,
                                    plan_is_active: 'Y',
                                    active_pan_id: plan_id,
                                    plan_start_dt: purchased,
                                    plan_end_dt: expired,
                                    modified_by: 'stripe-update-webhook',
                                    modified_dt: currDate
                                }
                            }
                        )

                        if (updatedUser) {
                            var userData = await User.findOne({ id: user.id })
                            const token = await createToken(userData);
                            res.cookie('auth_token', token, { httpOnly: true, secure: false });
                        }
                    } catch (error) {
                        console.error('Failed to update user and cookie:', error);
                        return res.render('failure', { message: 'Payment status is still processing or failed.' });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to save subscription:', error);
            return res.render('failure', { message: 'Payment status is still processing or failed.' });
        }




        // Determine the right message based on the mode
        const message = session.mode === 'subscription'
            ? 'Your subscription is now active!'
            : 'Your one-time payment was successful!';

        // Display a thank you page (using mock render for this example)
        // In your actual Express app, replace this with `res.render(...)`
        return res.render('user/subscription/success', {
            title: 'Subscription',
            email: customerEmail,
            // message: message,
            customerId: customerId,
            subscriptionId: subscriptionId,
            paymentIntentId: paymentIntentId // Pass the Payment Intent ID
        });
    } else {
        // Payment might be processing or failed
        return res.render('failure', { message: 'Payment status is still processing or failed.' });
    }
})

subscriptionRouter.get('/book_timeslot', (req, res) => {
    var timeslot_url = process.env.BOOK_TIMESLOT_URL
    res.render('user/subscription/book_timeslot', { title: 'Book Timeslot', timeslot_url })
})

module.exports = { subscriptionRouter };