const subscriptionRouter = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

subscriptionRouter.get('/', async (req, res) => {
    res.render('user/subscription/view', { title: 'Subscription' });
})

subscriptionRouter.get('/process', async (req, res) => {
    const sessionId = req.query.session_id,
        plan = req.query.product;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
    });
    // 2. Check the payment status
    if (session.payment_status === 'paid' && session.status === 'complete') {
        const customerId = session.customer ? session.customer.id : 'N/A';
        const paymentIntentId = session.payment_intent || 'N/A';
        const subscriptionId = session.subscription ? session.subscription.id : 'N/A';
        const customerEmail = session.customer_details.email;

        // Log for verification
        // console.log(`Payment Success for Session ID: ${sessionId}`);
        // console.log(`Customer ID found: ${customerId}`);
        // console.log(`Payment Intent ID found: ${paymentIntentId}`);

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

module.exports = { subscriptionRouter };