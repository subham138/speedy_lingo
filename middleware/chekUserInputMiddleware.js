module.exports = {
    checkUserInput: (req, res, next) => {
        // console.log(req.method, req.originalUrl)
        const path = req.originalUrl
        if(req.method == 'POST'){
            var data = req.body
            // console.log(data);
            
            if(Object.keys(data).length > 0){
                console.log(data);
                
                let unsafePattern = /<script.*?>.*?<\/script>|<iframe.*?>.*?<\/iframe>|<.*?on\w+=".*?".*?>|<style.*?>.*?<\/style>/gi;
                let htmlPattern = /<[^>]*>/gi; // Detects any HTML tags
                let malPattern = false

                for(let dt of Object.keys(data)){
                    if (unsafePattern.test(data[dt])) {
                        req.session['message'] = {msg: "Malicious content detected!", type:"err"}
                        console.log('Malicious content detected!');
                        
                        malPattern = true
                        break;
                    }
    
                    if (htmlPattern.test(data[dt])) {
                        req.session['message'] = {msg: "HTML tags are not allowed!", type:"err"}
                        console.log('HTML tags are not allowed!');
                        malPattern = true
                        break;
                    }
                }
                console.log(malPattern, 'Pattern detectection flag');
                
                if(malPattern){
                    res.redirect(path)
                }else{
                    next()
                }
            }else{
                next()
            }
        }else{
            next()
        }
    },
    chkUserIputFunc: (data) => {
        return new Promise((resolve, reject) => {
            if(Object.keys(data).length > 0){
                // console.log(data);
                
                let unsafePattern = /<script.*?>.*?<\/script>|<iframe.*?>.*?<\/iframe>|<.*?on\w+=".*?".*?>|<style.*?>.*?<\/style>/gi;
                let htmlPattern = /<[^>]*>/gi; // Detects any HTML tags
                let malPattern = false

                for(let dt of Object.keys(data)){
                    if (unsafePattern.test(data[dt])) {
                        // req.session['message'] = {msg: "Malicious content detected!", type:"err"}
                        console.log('Malicious content detected!');
                        malPattern = true
                        break;
                    }
    
                    if (htmlPattern.test(data[dt])) {
                        // req.session['message'] = {msg: "HTML tags are not allowed!", type:"err"}
                        console.log('HTML tags are not allowed!');
                        malPattern = true
                        break;
                    }
                }
                console.log(malPattern, 'Pattern detectection flag');
                
                if(malPattern){
                    resolve(0)
                }else{
                    resolve(1)
                }
            }else{
                resolve(1)
            }
        })
    }
}