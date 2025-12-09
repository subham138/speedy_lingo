$(document).ready(function () {
    let currentQuestionIndex = 0;
    const questions = $('.question');
    const totalQuestions = questions.length;
    let selectedAnswers = {}, selectedAns = {}, activeSection = null, ansQuest = {};

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
    var singleSelectedAns = {}, descImgSelAns = {};
    $('.question-multiple-choice, .question-translation, .question-describe-image').on('click', '.option-item', function () {
        activeSection = $(this).closest('.question').data('type');

        const qNum = $(this).closest('.question').data('qnum');
        const word = $(this).data('value');
        const qId = $(this).closest('.question').data('id');
        $(this).siblings().removeClass('selected wrong-answer correct-answer');
        $(this).addClass('selected'); // Add selected class for immediate feedback

        ansQuest[qNum] = $(this).data('correct');
        if (activeSection != 'describe-image') {
            singleSelectedAns[qNum] = { ans: word, qId: qId };
            selectedAnswers[activeSection] = singleSelectedAns;
        } else {
            descImgSelAns[qNum] = { ans: word, qId: qId };
            selectedAnswers[activeSection] = descImgSelAns;
        }

        // selectedAnswers[qNum] = $(this).data('value');
    });

    // Fill in the Blanks
    var fillBlanksAns = {}
    $('.blank-option').on('click', function () {
        activeSection = $(this).closest('.question').data('type');
        // console.log(activeSection, '+++++++++++');

        const qNum = $(this).closest('.question').data('qnum');
        const word = $(this).data('word');
        const qId = $(this).closest('.question').data('id');
        $(`#blank${qNum}`).text(word) //.addClass('filled');
        ansQuest[qNum] = $(this).data('correct');
        fillBlanksAns[qNum] = { ans: word, qId: qId };

        selectedAnswers[activeSection] = fillBlanksAns;

        $(this).addClass('selected').siblings().removeClass('selected wrong-answer correct-answer');
        $(`#blank${qNum}`).parent().next('.wrong-answer').hide()
        $(`#blank${qNum}`).removeClass('correct-answer wrong-answer')
        // Instant visual feedback on the blank itself
        // if ($(this).data('correct')) {
        //     $(`#blank${qNum}`).removeClass('wrong-answer').addClass('correct-answer');
        // } else {
        //     $(`#blank${qNum}`).removeClass('correct-answer').addClass('wrong-answer');
        // }
    });

    // Voice Question
    var selectedVoice = [], voiseAns = {};
    $('.voice-option').on('click', function () {
        activeSection = $(this).closest('.question').data('type');
        const qNum = $(this).closest('.question').data('qnum');
        const word = $(this).data('word');
        const qId = $(this).closest('.question').data('id');
        const optPosition = $(this).data('position').toString();

        // console.log($(`#voiceLine_${qNum}`).text(), '-----------');


        // if (!selectedAnswers[qNum]) {
        //     selectedAnswers[qNum] = [];
        // }

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            selectedVoice = selectedVoice.filter(w => w !== optPosition);
            voiseAns[qNum] = { ans: [...selectedVoice], qId: qId };
            selectedAnswers[activeSection] = voiseAns;
            $(`#voiceLine_${qNum} .voice-word[data-word="${word}"]`).remove();
            // $(`#voiceLine_${qNum}`).text().split('Click options below to form the sentence.').join('').trim();
            // console.log($(`#voiceLine_${qNum}`).text(), '-----------');

        } else {
            $(this).addClass('selected');
            selectedVoice.push(word);
            voiseAns[qNum] = { ans: [...selectedVoice], qId: qId };
            selectedAnswers[activeSection] = voiseAns;
            console.log(selectedAnswers, 'selected answers');
            
            $(`#voiceLine_${qNum}`).append(`<span class="voice-word" data-word="${word}">${$(this).text()}</span>`);
        }

        // console.log(selectedVoice, selectedAnswers);


        if ($(`#voiceLine_${qNum}`).is(':empty')) {
            $(`#voiceLine_${qNum}`).text('Click options below to form the sentence.');
        }
    });

    // Matching Pairs
    let selectedMatch = null, selectMatchArr = [], matchAns = {};
    $('.matching-item').on('click', function () {
        activeSection = $(this).closest('.question').data('type');
        const qNum = $(this).closest('.question').data('qnum');
        const currParentPosition = $(this).parent().data('match-position');
        const qId = $(this).closest('.question').data('id');

        // if (!selectedAnswers[qNum]) selectedAnswers[qNum] = {};

        if (selectedMatch) { // An item is already selected
            const firstItem = selectedMatch;
            const secondItem = $(this);

            // Prevent matching with an item from the same column
            if (firstItem.parent().data('match-position') === secondItem.parent().data('match-position')) {
                firstItem.removeClass('selected');
                secondItem.addClass('selected');
                selectedMatch = secondItem;
                return;
            }


            const firstMatch = firstItem.data('match');
            const secondMatch = secondItem.data(currParentPosition === 'left' ? 'lopt-id' : 'ropt-id');

            if (firstMatch === secondMatch) {
                // Correct match
                firstItem.add(secondItem).addClass('matched').removeClass('selected').off('click');
                var rightQuestId = 0, leftQuestId = 0;

                if (firstItem.parent().data('match-position') === 'left') {
                    leftQuestId = firstItem.data('lopt-id');
                    rightQuestId = secondItem.data('ropt-id');
                } else {
                    leftQuestId = secondItem.data('lopt-id');
                    rightQuestId = firstItem.data('ropt-id');
                }

                selectMatchArr.push({ left_id: leftQuestId, right_id: rightQuestId });
                // Making a deep copy of the previous array
                let finalArr = JSON.parse(JSON.stringify(selectMatchArr))

                matchAns[qNum] = { ans: finalArr, qId: qId };

                selectedAnswers[activeSection] = matchAns;
                // selectedAnswers[qNum][firstItem.data('match')] = secondItem.data('match');
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
        // console.log(currentQuestionIndex, '-------------');
        let qNum = currentQuestionIndex + 1;
        
        if (['match_pairs', 'audio_sentence'].includes(activeSection)) {
            selectMatchArr.length = 0
            if (currentQuestionIndex < totalQuestions - 1) {
                currentQuestionIndex++;
                selectedVoice.length = 0;
                showQuestion(currentQuestionIndex);
            }
            $('#clickBlocker').hide();
            return;
        }

        // $('#clickBlocker').show();
        // if (ansQuest[qNum]) {
        //     if (activeSection == 'fill-blanks') {
        //         $(`#blank${qNum}`).removeClass('wrong-answer').addClass('correct-answer');
        //         $(`#blank${qNum}`).parent().next('.wrong-answer').hide()
        //     }

        //     if (activeSection == 'select-correct' || activeSection == 'translation') {
        //         $(`#opt-${qNum}`).removeClass('wrong-answer').addClass('correct-answer');
        //     }
        // } else {
        //     if (activeSection == 'fill-blanks') {
        //         $(`#blank${qNum}`).removeClass('correct-answer').addClass('wrong-answer');
        //         $(`#blank${qNum}`).parent().next('.wrong-answer').show()
        //     }

        //     if (activeSection == 'select-correct' || activeSection == 'translation') {
        //         $(`#opt-${qNum}`).removeClass('correct-answer').addClass('wrong-answer');
        //     }
        // }
        // setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            currentQuestionIndex++;
            selectedVoice.length = 0;
            showQuestion(currentQuestionIndex);
        }
        //     $('#clickBlocker').hide();
        // }, 3000);
    });

    // Previous button
    $('#prevBtn').click(function () {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            selectedVoice.length = 0;
            showQuestion(currentQuestionIndex);
        }
    });

    // Submit button
    $('#submitBtn').click(function () {
        // calculateScore();
        // // Show animations on submit
        // questions.each(function () {
        //     const qNum = $(this).data('qnum');
        //     const type = $(this).data('type');
        //     const userAnswer = selectedAnswers[qNum];
        //     const isCorrect = checkAnswer(qNum, type, userAnswer);

        //     if (type === 'multiple-choice' || type === 'translation') {
        //         const selectedOption = $(this).find('.option-item.selected');
        //         if (selectedOption.length) {
        //             selectedOption.addClass(isCorrect ? 'correct-answer' : 'wrong-answer');
        //         }
        //     }
        // });        
        $.ajax({
            url: '/check-answer',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ answers: selectedAnswers }),
            beforeSend: function () {
                // Show loader
                $('#loader-container').addClass('show');
            },
            success: function (res) {
                console.log('Quiz submitted successfully:', res);
                if (res.suc > 0) {
                    let data = res.msg
                    localStorage.removeItem('quizScore');
                    localStorage.removeItem('quizTotal');
                    localStorage.removeItem('quizPercentage');
                    localStorage.setItem('quizScore', data.score);
                    localStorage.setItem('quizTotal', data.total);
                    localStorage.setItem('quizPercentage', Math.round((data.score / data.total) * 100));

                    setTimeout(redirectToResults, 1000);
                }

            },
            error: function (error) { console.error('Error submitting quiz:', error); },
            complete: function () {
                // Hide loader
                $('#loader-container').removeClass('show');
            }
        })
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
        window.location.href = '/result';
    }

    // Play voice button
    $('.btn-play-voice').click(function () {
        const btn = $(this);
        if (btn.hasClass('playing')) return;

        const audioFileName = btn.data('audio-path');
        if (!audioFileName) {
            console.error('Audio file path not found in data-audio-path attribute.');
            return;
        }

        const audio = new Audio(`/question/audio/${audioFileName}`);

        btn.addClass('playing').prop('disabled', true).html('<i class="icofont icofont-spinner icofont-spin me-2"></i>Playing...');
        const wave = btn.next('.voice-wave');
        wave.css('opacity', 1);

        audio.onended = function () {
            btn.removeClass('playing').prop('disabled', false).html('<i class="icofont icofont-play me-2"></i>Play Audio');
            wave.css('opacity', 0);
        };

        audio.onerror = function () {
            console.error('Error playing audio file.');
            // Restore button state on error as well
            btn.removeClass('playing').prop('disabled', false).html('<i class="icofont icofont-play me-2"></i>Play Audio');
            wave.css('opacity', 0);
        };

        audio.play();
    });

    $('.btn-audio').click(function () {
        const btn = $(this);
        if (btn.hasClass('playing')) return;

        const audioFileName = btn.data('audio-path');
        if (!audioFileName) {
            console.error('Audio file path not found in data-audio-path attribute.');
            return;
        }

        const audio = new Audio(`/question/audio/${audioFileName}`);

        btn.addClass('playing').prop('disabled', true).hide();
        const wave = btn.next('.voice-wave');
        wave.css('opacity', 1).show();

        audio.onended = function () {
            btn.removeClass('playing').prop('disabled', false).show();
            wave.css('opacity', 0).hide();
        };

        audio.onerror = function () {
            console.error('Error playing audio file.');
            // Restore button state on error as well
            btn.removeClass('playing').prop('disabled', false).show();
            wave.css('opacity', 0).hide();
        };

        audio.play();
    });

    // Set current year
    $('#year').text(new Date().getFullYear());

});