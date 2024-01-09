const max_characters_for_history = 20000;
let question_history;
let question_id;

const mergeDictionaries = (dict1, dict2) => {
    let merged = {};
    for (let key in dict1) merged[key] = dict1[key];
    for (let key in dict2) merged[key] = dict2[key];
    return merged;
}

const setQuestionText = (question_text, question_id) => {
    let questions = sessionStorage.getItem('questions');
    questions = questions ? JSON.parse(questions) : {};
    if (!questions[question_id]) {
        questions[question_id] = question_text;
        sessionStorage.setItem('questions', JSON.stringify(questions));
    }
}

const initializeHistoryForQuestionAndGet = (question_id) => {
    let parsed_question_histories = sessionStorage.getItem('question_histories');
    parsed_question_histories = parsed_question_histories ? JSON.parse(parsed_question_histories) : {};
    if (!parsed_question_histories[question_id]) {
        parsed_question_histories[question_id] = [];
        sessionStorage.setItem('question_histories', JSON.stringify(parsed_question_histories));
    }
    return parsed_question_histories[question_id];
}

const setQuestionHistory = (question_id, question_history) => {
    let parsed_question_histories = sessionStorage.getItem('question_histories');
    parsed_question_histories = parsed_question_histories ? JSON.parse(parsed_question_histories) : {};
    parsed_question_histories[question_id] = question_history;
    sessionStorage.setItem('question_histories', JSON.stringify(parsed_question_histories));
}

const initializeResponses = (question_id) => {
    let parsed_responses = sessionStorage.getItem('responses');
    parsed_responses = parsed_responses ? JSON.parse(parsed_responses) : {};
    if (!parsed_responses[question_id]) {
        parsed_responses[question_id] = '';
        sessionStorage.setItem('responses', JSON.stringify(parsed_responses));
    }
}

const setResponses = (question_id, response) => {
    let parsed_responses = sessionStorage.getItem('responses');
    parsed_responses = parsed_responses ? JSON.parse(parsed_responses) : {};
    parsed_responses[question_id] = response;
    sessionStorage.setItem('responses', JSON.stringify(parsed_responses));
}

Qualtrics.SurveyEngine.addOnload(function () {
    question_id = this.questionId;
    setQuestionText(this.getQuestionInfo().QuestionText, question_id);
    question_history = initializeHistoryForQuestionAndGet(question_id);
    initializeResponses(question_id);
    const questionContainer = this.getQuestionContainer();
    const questionInput = questionContainer.querySelector('textarea, input');
    let text_over_limit = false;
    let start_time;
    let t;

    questionInput.addEventListener('input', function (e) {
        setResponses(question_id, e.target.value);
        if (text_over_limit) return;
        if (!start_time) {
            t = 0;
            start_time = Date.now();
        } else {
            t = Date.now() - start_time;
        }
        const new_history = { s: e.target.value, t }
        const length_of_history = JSON.stringify([...question_history, new_history]).length;
        if (length_of_history > max_characters_for_history) {
            text_over_limit = true;
            return;
        }
        question_history.push(new_history);
        setQuestionHistory(question_id, question_history);
    });

    questionInput.addEventListener('copy', function (e) {
        if (text_over_limit) return;
        if (!start_time) {
            t = 0;
            start_time = Date.now();
        } else {
            t = Date.now() - start_time;
        }
        const selection = window.getSelection().toString();
        if (!selection) return;
        const new_history = { s: selection, o: 'c', t }
        const length_of_history = JSON.stringify([...question_history, new_history]).length;
        if (length_of_history > max_characters_for_history) {
            text_over_limit = true;
            return;
        }
        question_history.push(new_history);
        setQuestionHistory(question_id, question_history);
    });
});

Qualtrics.SurveyEngine.addOnPageSubmit(function () {
    const questions = JSON.parse(sessionStorage.getItem('questions'));
    const question_histories = JSON.parse(sessionStorage.getItem('question_histories'));
    const responses = JSON.parse(sessionStorage.getItem('responses'));
    const temp_alias_data = { questions, question_histories, responses }
    const old_alias_data = JSON.parse(Qualtrics.SurveyEngine.getEmbeddedData('alias_data'));
    const alias_data = mergeDictionaries(old_alias_data, temp_alias_data);
    Qualtrics.SurveyEngine.setEmbeddedData("alias_data", JSON.stringify(alias_data));
});