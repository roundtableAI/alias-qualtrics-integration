const qualtrics_key = // Add string here
const survey_id = // Add string here

Qualtrics.SurveyEngine.addOnPageSubmit(function (event) {
    const participant_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    Qualtrics.SurveyEngine.setEmbeddedData("alias_participant_id", participant_id);
    const questions = JSON.parse(sessionStorage.getItem('questions'));
    const question_histories = JSON.parse(sessionStorage.getItem('question_histories'));
    const responses = JSON.parse(sessionStorage.getItem('responses'));
    sessionStorage.removeItem('questions');
    sessionStorage.removeItem('question_histories');
    sessionStorage.removeItem('responses');
    const alias_data = { questions, question_histories, responses, participant_id, survey_id, alias_model: 'alias-v013' };
    fetch('https://roundtable.ai/api/qualtrics', {
        method: 'POST',
        mode: 'cors',
        cache: "default",
        headers: {
            'Content-Type': 'application/json',
            'qualtrics_key': qualtrics_key,
        },
        body: JSON.stringify(alias_data),
    })
});