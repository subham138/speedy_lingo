const { saveTransaction, manageProducts, manageSubscription } = require('../modules/stripeWebhookModule');

const StripeWebhookRouter = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

StripeWebhookRouter.post('/', async (req, res) => {
    let event, stripeResponse, user_id;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                endpointSecret
            );
        } catch (err) {
            console.log(`⚠️ Webhook signature verification failed.`, err.message);
            return res.sendStatus(400);
        }

        // console.log(event.type, 'EVENT TYPE');

        // Handle the event
        switch (event.type) {
            case 'invoice.paid':
                const paymentIntent = event.data.object;
                user_id = req.user ? req.user.user_id : 0;
                stripeResponse = await saveTransaction(paymentIntent, user_id, 'S');
                break;
            case 'invoice.payment_failed':
                const failedPaymentIntent = event.data.object;
                user_id = req.user ? req.user.user_id : 0;
                stripeResponse = await saveTransaction(failedPaymentIntent, user_id, 'F');
                break;
            // case 'customer.subscription.created':
            //     const subscription = event.data.object;
            //     console.log(`Subscription created: ${JSON.stringify(subscription)}`);
            //     // handleSubscriptionCreated(subscription);
            //     break;
            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object;
                // console.log(`Subscription deleted: ${JSON.stringify(deletedSubscription)}`);
                if (deletedSubscription.status == 'canceled')
                    stripeResponse = await manageSubscription(deletedSubscription, 'cancel', res);
                break;
            case 'customer.subscription.updated':
                const updatedSubscription = event.data.object;
                // console.log(`Subscription updated: ${JSON.stringify(updatedSubscription)}`);
                stripeResponse = await manageSubscription(updatedSubscription, updatedSubscription.status != 'canceled' ? 'update' : 'cancel', res);
                break;
            case 'product.created':
                const productCreated = event.data.object;
                // console.log(`Product created: ${JSON.stringify(productCreated)}`);
                stripeResponse = await manageProducts(productCreated, event.type);
                break;
            case 'product.updated':
                const productUpdated = event.data.object;
                // console.log(`Product updated: ${JSON.stringify(productUpdated)}`);
                stripeResponse = await manageProducts(productUpdated, event.type);
                break;
            case 'product.deleted':
                const productDeleted = event.data.object;
                // console.log(`Product deleted: ${JSON.stringify(productDeleted)}`);
                stripeResponse = await manageProducts(productDeleted, event.type);
                break;
            case 'plan.created':
                const planCreated = event.data.object;
                // console.log(`Plan created: ${JSON.stringify(planCreated)}`);
                stripeResponse = await manageProducts(planCreated, event.type);
                break;
            case 'plan.updated':
                const planUpdated = event.data.object;
                // console.log(`Plan updated: ${JSON.stringify(planUpdated)}`);
                stripeResponse = await manageProducts(planUpdated, event.type);
                break;
            case 'plan.deleted':
                const planDeleted = event.data.object;
                // console.log(`Plan deleted: ${JSON.stringify(planDeleted)}`);
                stripeResponse = await manageProducts(planDeleted, event.type);
                break;

            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        // console.log(stripeResponse);

        // Return a response to acknowledge receipt of the event
        res.json({ received: true });
    }
})

module.exports = { StripeWebhookRouter };