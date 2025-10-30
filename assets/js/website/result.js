// Fetch or Default Data (Sample: 7/10, 70%, Advanced)
let score = parseInt(localStorage.getItem('quizScore')) || 0;
let total = parseInt(localStorage.getItem('quizTotal')) || 0;
let percentage = parseInt(localStorage.getItem('quizPercentage')) || 0;
let correct = score;
let incorrect = total - score;

const ScoreMaster = [
    { min: 0, max: 16.67, level: 'a1', level_text: 'Beginner' },
    { min: 20, max: 33.33, level: 'a2', level_text: 'Beginner'  },
    { min: 36.67, max: 50, level: 'b1', level_text: 'Intermediate' },
    { min: 53.33, max: 83.33, level: 'b2', level_text: 'Intermediate' },
    { min: 86.67, max: 93.33, level: 'c1', level_text: 'Advanced' },
    { min: 96.67, max: 100, level: 'c2', level_text: 'Advanced' }
]

// Animate Score Display
function animateScore(element, start, end, duration = 2000) {
    let startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        $(element).text(`${current} out of ${total}`);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
animateScore($('#scoreHero'), 0, score);
$('#percentageHero') ? $('#percentageHero').text(`${percentage}%`) : '';
$('#correctCount') ? $('#correctCount').text(correct) : '';
$('#incorrectCount') ? $('#incorrectCount').text(incorrect) : '';

$(document).ready(function() {
    const currentLevel = ScoreMaster.find(
        range => percentage >= range.min && percentage <= range.max
    )
    console.log(currentLevel.level, percentage, '00000');
    
    $('#levelBadge').text(`${currentLevel.level_text} (${currentLevel.level.toUpperCase()})`);
    $('#rlevel').text(currentLevel.level.toUpperCase());
    const assessment = JSON.parse(localStorage.getItem('assessment') || '[]');
    if(assessment && assessment.length > 0){
        for(let assess of assessment){
            switch(assess.assessment_section){
                case 'Understanding':
                    $('#und-lis').text(assess.assessment_for[0].descriptio[currentLevel.level]);
                    $('#und-read').text(assess.assessment_for[1].descriptio[currentLevel.level]);
                    break;
                case 'Speaking':
                    $('#spe-spo-int').text(assess.assessment_for[0].descriptio[currentLevel.level]);
                    $('#spe-spo-pro').text(assess.assessment_for[1].descriptio[currentLevel.level]);
                    break;
                case 'Writing':
                    $('#wri-wri').text(assess.assessment_for[0].descriptio[currentLevel.level]);
                    break;
                default:
                    break;
            }
        }
    }    
})