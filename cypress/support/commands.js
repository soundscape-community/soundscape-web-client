// Mock speech synthesis API for headless testing
Cypress.Commands.add('mockSpeechSynthesis', () => {
  cy.window().then((win) => {
    cy.stub(win.speechSynthesis, 'speak').as('speak');
    cy.stub(win.speechSynthesis, 'cancel').as('cancel');
    cy.stub(win.speechSynthesis, 'pause').as('pause');
    cy.stub(win.speechSynthesis, 'resume').as('resume');
    cy.stub(win.speechSynthesis, 'getVoices').returns([]).as('getVoices');
  });
});