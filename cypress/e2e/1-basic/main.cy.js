/// <reference types="cypress" />

describe('GPX view', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/soundscape-web-client/#/gpx')
  })

  it('displays the welcome screen', () => {
    cy.get('button').should('have.length', 1)
    cy.get('button').first().should('have.text', 'Start exploring')
  })
})
