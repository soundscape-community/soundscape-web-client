/// <reference types="cypress" />

describe('GPX view', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/soundscape-web-client/#/gpx')
    cy.mockSpeechSynthesis();

    // Return static tile data for all network calls
    cy.intercept('GET', /\/tiles\/.*/, {
      fixture: 'tiles_16_18109_23965.json'
    }).as('tile');
  })

  it('displays the welcome screen', () => {
    cy.get('button').should('have.length', 1)
    cy.get('button').first().should('have.text', 'Start exploring')
  })

  it('sets the map to the first point in the GPX file', () => {
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

  it('updates the map based on slider input', () => {
    cy.get('button').click()
    cy.get('#gpxFileInput').selectFile('cypress/fixtures/waterloo.gpx')

    cy.get('#pointSlider').invoke('val', 50).trigger('input')

    const expectedLat = 43.453;
    const expectedLng = -80.498;

    cy.get('#map').should(($map) => {
      const map = $map[0]._leafletMap;

      const center = map.getCenter();
      expect(center.lat).to.be.closeTo(expectedLat, 0.001);
      expect(center.lng).to.be.closeTo(expectedLng, 0.001);
    });
  })

  it('starts fetching tiles', () => {
    cy.get('button').click()
    cy.get('#btn_clear').click()
    cy.get('#gpxFileInput').selectFile('cypress/fixtures/waterloo.gpx')

    const expectedTileUrl = '/tiles/16/18108/23964.json';

    cy.get('#playPauseButton').click()
    cy.wait('@tile').its('request.url').should('include', expectedTileUrl);
  })

  it('starts speaking', () => {
    cy.get('button').click()
    cy.get('#btn_clear').click()
    cy.get('#gpxFileInput').selectFile('cypress/fixtures/waterloo.gpx')

    const expectedFirstCallout = "Memorial Park";

    // Advance the GPX file slightly so we hit the first callout more quickly
    cy.get('#pointSlider').invoke('val', 1).trigger('input')

    cy.get('#playPauseButton').click()
    cy.get('@speak').should('have.been.calledWithMatch', (utterance) => {
      return utterance.text === expectedFirstCallout;
    });
  })
})
