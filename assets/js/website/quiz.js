$(document).ready(function () {
    let currentQuestionIndex = 0;
    const questions = $('.question');
    const totalQuestions = questions.length;
    let selectedAnswers = {};

    const correctAnswers = {
        1: 'joyful',
        2: 'doctor',
        3: ['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'],
        4: { 1: '1', 2: '2', 3: '3' }, // Matching pairs
        5: 'correct'
    };

    // Start Quiz
    $('#startQuizBtn').click(function () {
        $('#quizIntro').fadeOut(300, function () {
            $('#quizProgress, #quizContainer').removeClass('d-none').fadeIn(300);
            showQuestion(currentQuestionIndex);
        });
    });

    // Show question
    function showQuestion(index) {
        questions.hide();
        $(questions[index]).fadeIn(500);
        $('#questionCounter').text(`Question ${index + 1} of ${totalQuestions}`);
        updateProgress();

        $('#prevBtn').toggleClass('d-none', index === 0);
        $('#nextBtn').toggleClass('d-none', index === totalQuestions - 1);
        $('#submitBtn').toggleClass('d-none', index !== totalQuestions - 1);
    }

    // Update progress bar
    function updateProgress() {
        // The progress should be 0% on the first question and 100% on the last.
        // We calculate it based on the index of the current question relative to the total.
        const progressPercentage = totalQuestions > 1 ? (currentQuestionIndex / (totalQuestions - 1)) * 100 : 100;
        $('#progressBar').css('width', progressPercentage + '%');
    }

    // --- Event Handlers for different question types ---

    // Multiple Choice & Translation
    $('.question-multiple-choice, .question-translation').on('click', '.option-item', function () {
        const qNum = $(this).closest('.question').data('qnum');
        $(this).siblings().removeClass('selected wrong-answer correct-answer');
        $(this).addClass('selected'); // Add selected class for immediate feedback
        selectedAnswers[qNum] = $(this).data('value');
    });

    // Fill in the Blanks
    $('.blank-option').on('click', function () {
        const qNum = $(this).closest('.question').data('qnum');
        const word = $(this).data('word');
        $('#blank1').text(word).addClass('filled');

        selectedAnswers[qNum] = word;
        $(this).addClass('selected').siblings().removeClass('selected wrong-answer correct-answer');

        // Instant visual feedback on the blank itself
        if ($(this).data('correct')) {
            $('#blank1').removeClass('wrong-answer').addClass('correct-answer');
        } else {
            $('#blank1').removeClass('correct-answer').addClass('wrong-answer');
        }
    });

    // Voice Question
    $('.voice-option').on('click', function () {
        const qNum = $(this).closest('.question').data('qnum');
        const word = $(this).data('word');

        if (!selectedAnswers[qNum]) {
            selectedAnswers[qNum] = [];
        }

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            selectedAnswers[qNum] = selectedAnswers[qNum].filter(w => w !== word);
            $(`#voiceLine .voice-word[data-word="${word}"]`).remove();
        } else {
            $(this).addClass('selected');
            selectedAnswers[qNum].push(word);
            $('#voiceLine').append(`<span class="voice-word" data-word="${word}">${$(this).text()}</span>`);
        }

        if ($('#voiceLine').is(':empty')) {
            $('#voiceLine').text('Click options below to form the sentence.');
        }
    });

    // Matching Pairs
    let selectedMatch = null;
    $('.matching-item').on('click', function () {
        const qNum = $(this).closest('.question').data('qnum');
        if (!selectedAnswers[qNum]) selectedAnswers[qNum] = {};

        if (selectedMatch) { // An item is already selected
            const firstItem = selectedMatch;
            const secondItem = $(this);

            // Prevent matching with an item from the same column
            if (firstItem.parent().attr('id') === secondItem.parent().attr('id')) {
                firstItem.removeClass('selected');
                secondItem.addClass('selected');
                selectedMatch = secondItem;
                return;
            }

            if (firstItem.data('match') === secondItem.data('match')) {
                // Correct match
                firstItem.add(secondItem).addClass('matched').removeClass('selected').off('click');
                selectedAnswers[qNum][firstItem.data('match')] = secondItem.data('match');
            } else {
                // Incorrect match
                firstItem.add(secondItem).addClass('wrong-answer');
                setTimeout(() => {
                    firstItem.add(secondItem).removeClass('wrong-answer selected');
                }, 800);
            }
            selectedMatch = null; // Reset selection
        } else { // No item is selected
            $(this).addClass('selected');
            selectedMatch = $(this);
        }
    });

    // Next button
    $('#nextBtn').click(function () {
        if (currentQuestionIndex < totalQuestions - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });

    // Previous button
    $('#prevBtn').click(function () {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    // Submit button
    $('#submitBtn').click(function () {
        calculateScore();
        // Show animations on submit
        questions.each(function () {
            const qNum = $(this).data('qnum');
            const type = $(this).data('type');
            const userAnswer = selectedAnswers[qNum];
            const isCorrect = checkAnswer(qNum, type, userAnswer);

            if (type === 'multiple-choice' || type === 'translation') {
                const selectedOption = $(this).find('.option-item.selected');
                if (selectedOption.length) {
                    selectedOption.addClass(isCorrect ? 'correct-answer' : 'wrong-answer');
                }
            }
        });
        // Redirect after a delay to show animations
        setTimeout(redirectToResults, 1500);
    });

    function calculateScore() {
        let score = 0;
        questions.each(function () {
            const qNum = $(this).data('qnum');
            const type = $(this).data('type');
            const userAnswer = selectedAnswers[qNum];
            const correctAnswer = correctAnswers[qNum];
            const isCorrect = checkAnswer(qNum, type, userAnswer);
            if (isCorrect) score++;
        });

        localStorage.setItem('quizScore', score);
        localStorage.setItem('quizTotal', totalQuestions);
        localStorage.setItem('quizPercentage', Math.round((score / totalQuestions) * 100));
    }

    function checkAnswer(qNum, type, userAnswer) {
        const correctAnswer = correctAnswers[qNum];
        let isCorrect = false;
        switch (type) {
            case 'multiple-choice':
            case 'translation':
            case 'fill-blanks':
                isCorrect = userAnswer === correctAnswer;
                break;
            case 'voice':
                // Simple check for now, can be improved for order
                isCorrect = userAnswer && correctAnswer.length === userAnswer.length && correctAnswer.every(word => userAnswer.includes(word));
                break;
            case 'matching':
                isCorrect = userAnswer && Object.keys(correctAnswer).length === Object.keys(userAnswer).length && Object.keys(correctAnswer).every(key => userAnswer[key] === correctAnswer[key]);
                break;
        }
        return isCorrect;
    }

    function redirectToResults() {
        window.location.href = 'result.html';
    }

    // Play voice button
    $('#playVoiceBtn').click(function () {
        const btn = $(this);
        if (btn.hasClass('playing')) return;
        btn.addClass('playing').prop('disabled', true).html('<i class="icofont icofont-spinner icofont-spin me-2"></i>Playing...');
        $('#voiceWave').css('opacity', 1);
        setTimeout(() => {
            btn.removeClass('playing').prop('disabled', false).html('<i class="icofont icofont-play me-2"></i>Play Audio');
            $('#voiceWave').css('opacity', 0);
        }, 3000);
    });

    // Set current year
    $('#year').text(new Date().getFullYear());
});