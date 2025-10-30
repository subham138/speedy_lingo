const generateCaptcha = () => {
    return new Promise((resolve, reject) => {
        try {
            const captcha = Math.floor(1000 + Math.random() * 9000).toString();
            resolve(captcha);
        } catch (error) {
            reject(error);
        }
    })
}

module.exports = { generateCaptcha };