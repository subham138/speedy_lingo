const StripeProduct = require("../models/Products");

const manageProducts = (data, event) => {
    return new Promise(async (resolve, reject) => {
        console.log(event, data);
        
        try{
            if (event === 'plan.created' || event === 'plan.updated'){
                const price_id = data.id
                const product_dtls = await StripeProduct.findOne({ stripe_product_id: price_id, stripe_plan_id: data.product });
                if(product_dtls && Object.keys(product_dtls).length > 0){
                    // Update existing product
                    product_dtls.stripe_product_title = data.name;
                    product_dtls.amount = data.amount ? parseInt(data.amount) : 0;
                    product_dtls.interval = data.interval ? data.interval : 'N/A';
                    product_dtls.updated_by = 'system';
                    product_dtls.updated_dt = new Date();
                    await product_dtls.save();
                    resolve({suc: 1, msg: 'Product updated successfully'});
                }else{
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
                    resolve({suc: 1, msg: 'Product created successfully'});
                }
            } else if (event === 'plan.deleted'){
                const price_id = data.id
                await StripeProduct.deleteOne({ stripe_product_id: price_id });
                resolve({suc: 1, msg: 'Product deleted successfully'});
            }else{
                resolve({suc: 0, msg: 'No action for this event'});
            }
        }catch(err){
            console.log(err);
            
            reject({suc: 0, msg: 'Error managing products', error: err});
        }
    })
}

module.exports = {
    manageProducts
}