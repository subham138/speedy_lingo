$('#country').on('change', function () {
    let flagUrl = $(this).find('option:selected').data('flag');
    if (flagUrl) {
        $('#selected-flag').attr('src', 'https://flagcdn.com/' + flagUrl);
    }
});
$('#password, #repass').on('change', function () {
    const password = $('#password').val();
    const repass = $('#repass').val();
    if (repass && password !== repass) {
        $('#repass').addClass('is-invalid');
    } else {
        $('#repass').removeClass('is-invalid');
    }
});
$('.pass-icon').on('click', function () {
    const passwordField = $(this).next();
    const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
    passwordField.attr('type', type);
    $(this).toggleClass('icofont-eye-blocked icofont-eye');
})

function generateCaptcha(captcha){
    const canvas = document.getElementById('captcha-canvas');
    const ctx = canvas.getContext('2d');
    const captchaText = captcha;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the captcha text
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);

    // Add some noise lines for security
    ctx.strokeStyle = '#ccc';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
}