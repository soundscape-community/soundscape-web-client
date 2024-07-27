// Mock speech synthesis API for headless testing
Cypress.Commands.add('mockSpeechSynthesis', () => {
  cy.window().then((win) => {
    const originalSpeak = win.speechSynthesis.speak;
    const originalCancel = win.speechSynthesis.cancel;
    const originalPause = win.speechSynthesis.pause;
    const originalResume = win.speechSynthesis.resume;
    const originalGetVoices = win.speechSynthesis.getVoices;

    const speakStub = cy.stub(win.speechSynthesis, 'speak').callsFake((utterance) => {
      console.log('Mock speak called with:', utterance);

    }).as('speak');

    cy.stub(win.speechSynthesis, 'cancel').callsFake(() => {
      console.log('Mock cancel called');
    }).as('cancel');

    cy.stub(win.speechSynthesis, 'pause').callsFake(() => {
      console.log('Mock pause called');
    }).as('pause');

    cy.stub(win.speechSynthesis, 'resume').callsFake(() => {
      console.log('Mock resume called');
    }).as('resume');

    cy.stub(win.speechSynthesis, 'getVoices').callsFake(() => {
      console.log('Mock getVoices called');
      return [];
    }).as('getVoices');
  });
});