const { createToken } = require("../middleware/authMiddleware");
const StripeProduct = require("../models/Products");
const User = require("../models/User");
const UserSubscription = require("../models/UserSubscription");
const UserTransaction = require("../models/UserTransaction");

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY),
    dateFormat = require("dateformat");

const manageProducts = (data, event) => {
    return new Promise(async (resolve, reject) => {
        console.log(event, data);
        try {
            if (event === 'plan.created' || event === 'plan.updated') {
                const price_id = data.id
                const product_dtls = await StripeProduct.findOne({ stripe_product_id: price_id, stripe_plan_id: data.product });
                if (product_dtls && Object.keys(product_dtls).length > 0) {
                    // Update existing product
                    product_dtls.stripe_product_title = data.name;
                    product_dtls.amount = data.amount ? parseInt(data.amount) : 0;
                    product_dtls.interval = data.interval ? data.interval : 'N/A';
                    product_dtls.updated_by = 'system';
                    product_dtls.updated_dt = new Date();
                    await product_dtls.save();
                    resolve({ suc: 1, msg: 'Product updated successfully' });
                } else {
                    // Create new product
                    const newProduct = new StripeProduct(
                        {
                            stripe_plan_id: data.product ? data.product : 'N/A',
                            stripe_product_id: price_id,
                            stripe_product_title: data.nickname ? data.nickname : data.nickname,
                            amount: data.amount ? parseInt(data.amount) : 0,
                            interval: data.interval ? data.interval : 'N/A',
                            created_by: 'system',
                            created_dt: new Date()
                        }
                    );
                    await newProduct.save();
                    resolve({ suc: 1, msg: 'Product created successfully' });
                }
            } else if (event === 'plan.deleted') {
                const price_id = data.id
                await StripeProduct.deleteOne({ stripe_product_id: price_id });
                resolve({ suc: 1, msg: 'Product deleted successfully' });
            } else {
                resolve({ suc: 0, msg: 'No action for this event' });
            }
        } catch (err) {
            console.log(err);

            reject({ suc: 0, msg: 'Error managing products', error: err });
        }
    })
}

const manageSubscription = (data, event, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            let Response;
            // Handle the event
            const currDate = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
            switch (event) {
                case 'update':
                    // try {
                    //     var invoiceDt = await stripe.invoices.retrieve(data.latest_invoice);
                    //     await saveTransaction(invoiceDt, 0, 'S')
                    // } catch (err) {
                    //     console.log('Error saving transaction for updated subscription invoice:', err);
                    // }

                    const planDtls = await StripeProduct.findOne({ stripe_product_id: data.plan.product });

                    const plan_id = planDtls ? (planDtls.id ? planDtls.id : 0) : 0,
                        prod_name = planDtls ? (planDtls.plan_name ? planDtls.plan_name : '') : '';
                    const month_yearly = data.plan.interval;

                    const purchaseDate = new Date(data?.start_date * 1000);
                    const expireDate = new Date(purchaseDate);

                    if (month_yearly === "month") {
                        expireDate.setMonth(expireDate.getMonth() + 1);
                    } else if (month_yearly === "year") {
                        expireDate.setFullYear(expireDate.getFullYear() + 1);
                    }

                    const purchased = purchaseDate.toLocaleString("en-CA", { hour12: false }).replace(",", "");
                    const expired = expireDate.toLocaleString("en-CA", { hour12: false }).replace(",", "");

                    // console.log(data.plan.amount, 'PLAN', data.plan);

                    var chk_subs = await UserSubscription.findOne({ stripe_subscription_id: data.id, status: { $ne: 'canceled' } }, 'id, user_id');

                    const user_id = chk_subs ? (chk_subs.user_id ? chk_subs.user_id : 0) : 0;
                    if (chk_subs && Object.keys(chk_subs).length > 0) {
                        await UserSubscription.updateOne({ stripe_subscription_id: data.id }, {
                            $set: {
                                status: 'canceled',
                                modified_by: 'stripe-update-webhook',
                                modified_dt: currDate,
                            }
                        })
                    }

                    const subsData = {
                        user_id: user_id,
                        product_name: prod_name,
                        month_yearly: month_yearly,
                        stripe_product_id: data.plan.product,
                        stripe_plan_id: data.plan.id,
                        purchase_date: purchased,
                        expires_date: expired,
                        stripe_subscription_id: data.id,
                        stripe_customer_id: data.customer,
                        amount: data.plan.amount / 100,
                        currency: data.currency,
                        status: data.status,
                        full_json: JSON.stringify(data),
                        created_by: 'stripe-update-webhook',
                        created_dt: currDate,
                    }

                    var subscriptionSave = new UserSubscription(subsData);
                    const saveDt = await subscriptionSave.save();
                    if (!saveDt)
                        resolve({ suc: 0, msg: 'Error saving subscription' });
                    else {
                        try {
                            var updatedUser = await User.updateOne({ stripe_customer_id: data.customer },
                                {
                                    $set: {
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
                                var userData = await User.findOne({ id: user_id })
                                const token = await createToken(userData);
                                res.cookie('auth_token', token, { httpOnly: true, secure: false });
                            }
                        } catch (err) {
                            console.log('Error while updating the user subscription on user table');
                        }
                        resolve({ suc: 1, msg: 'Subscription saved successfully' });
                    }
                    break;
                case 'cancel':
                    var chk_subs = await UserSubscription.findOne({
                        stripe_subscription_id: data.id,
                        stripe_product_id: data.plan.product,
                        stripe_plan_id: data.plan.id
                    }, 'id, user_id')

                    const userId = chk_subs ? (chk_subs.user_id ? chk_subs.user_id : 0) : 0;

                    var canceled_at = data.canceled_at ? dateFormat(new Date(data.canceled_at * 1000), "yyyy-mm-dd HH:MM:ss") : currDate;

                    const cancel_comment = data.cancellation_details ? (data.cancellation_details.comment ? data.cancellation_details.comment : '') : '',
                        cancel_feedback = data.cancellation_details ? (data.cancellation_details.feedback ? data.cancellation_details.feedback : '') : '',
                        cancel_reason = data.cancellation_details ? (data.cancellation_details.reason ? data.cancellation_details.reason : '') : '';

                    if (chk_subs && Object.keys(chk_subs).length) {
                        var subsId = chk_subs.id;
                        Response = await UserSubscription.updateOne({ id: subsId },
                            {
                                $set: {
                                    status: 'canceled',
                                    cancel_comment: cancel_comment,
                                    cancel_feedback: cancel_feedback,
                                    cancel_reason: cancel_reason,
                                    canceled_at: canceled_at,
                                    canceled_json: JSON.stringify(data),
                                    modified_by: 'stripe-update-webhook',
                                    modified_dt: currDate
                                }
                            }
                        )
                        if (!Response)
                            resolve({ suc: 0, msg: 'Error canceling subscription' });
                        else {
                            try {
                                var updatedUser = await User.updateOne({ stripe_customer_id: data.customer },
                                    {
                                        $set: {
                                            plan_is_active: 'N',
                                            active_pan_id: null,
                                            plan_start_dt: null,
                                            plan_end_dt: null,
                                            modified_by: 'stripe-update-webhook',
                                            modified_dt: currDate
                                        }
                                    }
                                )
                                if (updatedUser) {
                                    var userData = await User.findOne({ id: userId })
                                    const token = await createToken(userData);
                                    console.log(token);
                                    
                                    res.cookie('auth_token', token, { httpOnly: true, secure: false });
                                }
                            } catch (err) {
                                console.log('Error while updating the user subscription in user table');
                            }
                            resolve({ suc: 1, msg: 'Subscription canceled successfully' });
                        }
                    } else {
                        resolve({ suc: 0, msg: 'Subscription not found to cancel' });
                    }
                    break;
                default:
                    console.log(`Unhandled event type ${event}`);
                    resolve({ suc: 0, msg: `Unhandled event type ${event}` });
            }
            // console.log(stripeResponse);
        } catch (err) {
            console.log(err);
            reject({ suc: 0, msg: 'Error managing subscription', error: err });
        }
    })
}

const saveTransaction = (data, user_id, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            const curr_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
            var trnsDt = {
                entry_dt: curr_dt,
                invoice_id: data.id,
                subscription_id: data.parent.subscription_details ? data.parent.subscription_details.subscription : "",
                due_amount: data.amount_due / 100,
                received_amount: data.amount_paid / 100,
                total_paied: data.total / 100,
                currency: data.currency,
                stripe_customer_id: data.customer,
                pay_status: status != 'S' ? 'failed' : data.status,
                customer_email: data.customer_email,
                customer_name: data.customer_name,
                full_json: JSON.stringify(data),
                created_by: 'system',
                created_dt: curr_dt
            }
            if (status != 'S') {
                trnsDt['failed_code'] = data.last_payment_error ? data.last_payment_error.code : ""
                trnsDt['failed_decline_code'] = data.last_payment_error ? data.last_payment_error.decline_code : ""
                trnsDt['failed_message'] = data.last_payment_error ? data.last_payment_error.message : ""
                trnsDt['failed_type'] = data.last_payment_error ? data.last_payment_error.type : ""
            } else {
                trnsDt['hosted_invoice_url'] = data.hosted_invoice_url
                trnsDt['invoice_pdf'] = data.invoice_pdf
            }
            var saveTransaction = new UserTransaction(trnsDt);
            const saveDt = await saveTransaction.save();
            if (saveDt)
                resolve({ suc: 1, msg: 'Transaction saved successfully' });
            else
                resolve({ suc: 0, msg: 'Error saving transaction' });
        } catch (err) {
            console.log(err);
            reject({ suc: 0, msg: 'Error saving transaction', error: err });
        }
    })
}

module.exports = {
    manageProducts,
    manageSubscription,
    saveTransaction
}