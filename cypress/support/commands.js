// Mock speech synthesis API for headless testing
Cypress.Commands.add('mockSpeechSynthesis', () => {
  cy.window().then((win) => {
    cy.stub(win.speechSynthesis, 'speak').as('speak');
    cy.stub(win.speechSynthesis, 'cancel').as('cancel');
    cy.stub(win.speechSynthesis, 'pause').as('pause');
    cy.stub(win.speechSynthesis, 'resume').as('resume');
    cy.stub(win.speechSynthesis, 'getVoices').returns([{
      "name": "John Doe",
      "lang": "en-US"
    }]).as('getVoices');
  });
});

// Mock geolocation API for headless testing
Cypress.Commands.add('mockGeolocation', (latitude, longitude) => {
  cy.window().then((win) => {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
      return cb({ coords: { latitude, longitude } });
    });
  });
});

// Check if audio is playing for beacon testing
Cypress.Commands.add('isAudioPlaying', () => {
  cy.window().then((win) => {
    return (win.navigator.mediaSession.playbackState == 'playing');
  });
});