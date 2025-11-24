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

// Shuffle function
const shuffleOptions = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

module.exports = { generateCaptcha, shuffleOptions };