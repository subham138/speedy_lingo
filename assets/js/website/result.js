// Fetch or Default Data (Sample: 7/10, 70%, Advanced)
let score = parseInt(localStorage.getItem('quizScore')) || 7;
let total = parseInt(localStorage.getItem('quizTotal')) || 10;
let percentage = parseInt(localStorage.getItem('quizPercentage')) || 70;
let correct = score;
let incorrect = total - score;

// Animate Score Display
function animateScore(element, start, end, duration = 2000) {
    let startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.innerHTML = `${current} out of ${total}`;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}
animateScore(document.getElementById('scoreHero'), 0, score);
document.getElementById('percentageHero') ? document.getElementById('percentageHero').innerHTML = `${percentage}%` : '';
document.getElementById('correctCount') ? document.getElementById('correctCount').innerHTML = correct : '';
document.getElementById('incorrectCount') ? document.getElementById('incorrectCount').innerHTML = incorrect : '';

// Determine Level and Update UI
let levelClass = 'level-beginner';
let levelName = 'Beginner';
let adviceContent = '';
let intermediateWidth = 0, advancedWidth = 0, expertWidth = 0;

if (percentage >= 80) {
    levelClass = 'level-expert';
    levelName = 'Expert';
    adviceContent = `
                <div class="row">
                    <div class="col-md-6">
                        <h5><i class="bi bi-check-circle-fill text-success me-2"></i>Congratulations!</h5>
                        <p>You're an expert. Challenge yourself with advanced topics.</p>
                        <ul class="list-unstyled">
                            <li><i class="bi bi-arrow-right me-2"></i>Mentor others</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Real-world projects</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Coursera advanced courses</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h5><i class="bi bi-lightbulb me-2"></i>Next Steps</h5>
                        <p>Read: "Thinking, Fast and Slow" by Kahneman.</p>
                    </div>
                </div>
            `;
    expertWidth = 100;
    advancedWidth = 100;
    intermediateWidth = 100;
    setTimeout(confettiBurst, 1000); // Delay for animation
} else if (percentage >= 60) {
    levelClass = 'level-advanced';
    levelName = 'Advanced';
    adviceContent = `
                <div class="row">
                    <div class="col-md-6">
                        <h5><i class="bi bi-check-circle-fill text-info me-2"></i>Great Job!</h5>
                        <p>Solid foundation. Focus on refinement.</p>
                        <ul class="list-unstyled">
                            <li><i class="bi bi-arrow-right me-2"></i>Review weak areas</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Timed practice</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Khan Academy</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h5><i class="bi bi-lightbulb me-2"></i>Pro Tip</h5>
                        <p>Track progress weekly.</p>
                    </div>
                </div>
            `;
    advancedWidth = 100;
    intermediateWidth = 100;
} else if (percentage >= 40) {
    levelClass = 'level-intermediate';
    levelName = 'Intermediate';
    adviceContent = `
                <div class="row">
                    <div class="col-md-6">
                        <h5><i class="bi bi-check-circle-fill text-warning me-2"></i>On Track!</h5>
                        <p>Building momentum. Dive deeper.</p>
                        <ul class="list-unstyled">
                            <li><i class="bi bi-arrow-right me-2"></i>YouTube tutorials</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Weekly quizzes</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Study groups</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h5><i class="bi bi-lightbulb me-2"></i>Next Steps</h5>
                        <p>Break topics into small parts.</p>
                    </div>
                </div>
            `;
    intermediateWidth = 100;
} else {
    levelClass = 'level-beginner';
    levelName = 'Beginner';
    adviceContent = `
                <div class="row">
                    <div class="col-md-6">
                        <h5><i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>Keep Trying!</h5>
                        <p>Everyone starts somewhere. Focus on basics.</p>
                        <ul class="list-unstyled">
                            <li><i class="bi bi-arrow-right me-2"></i>Basic tutorials</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Flashcards</li>
                            <li><i class="bi bi-arrow-right me-2"></i>Practice daily</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h5><i class="bi bi-lightbulb me-2"></i>Pro Tip</h5>
                        <p>Set small, achievable goals.</p>
                    </div>
                </div>
            `;
}