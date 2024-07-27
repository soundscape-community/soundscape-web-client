/// <reference types="cypress" />

describe('GPX view', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/soundscape-web-client/#/gpx')
    cy.mockSpeechSynthesis();
  })

  it('displays the welcome screen', () => {
    cy.get('button').should('have.length', 1)
    cy.get('button').first().should('have.text', 'Start exploring')
  })

  it('sets map to first point in the GPX file', () => {
    cy.get('button').click()
    cy.get('#gpxFileInput').selectFile('cypress/fixtures/waterloo.gpx')

    const expectedLat = 43.464;
    const expectedLng = -80.525;
    const expectedZoom = 16;

    cy.get('#map').should(($map) => {
      const map = $map[0]._leafletMap;

      const center = map.getCenter();
      expect(center.lat).to.be.closeTo(expectedLat, 0.001);
      expect(center.lng).to.be.closeTo(expectedLng, 0.001);

      const zoom = map.getZoom();
      expect(zoom).to.equal(expectedZoom);
    });
  })
})
