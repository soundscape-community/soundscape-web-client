/// <reference types="cypress" />

describe('Fixed-location view', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/soundscape-web-client/#/fixed/38.897600/-77.006156')
    cy.mockSpeechSynthesis();

    // Return empty data for all but one tile
    cy.intercept('GET', /\/tiles\/.*/, {
      body: {},
    }).as('other-tiles');

    cy.intercept('GET', '/tiles/16/18749/25070.json', {
      fixture: 'tiles_16_18749_25070.json'
    }).as('tile');
  })

  it('displays the welcome screen', () => {
    cy.get('button').should('have.length', 1)
    cy.get('button').first().should('have.text', 'Start exploring')
  })

  it('sets the map to the specified location', () => {
    cy.get('button').click()

    const expectedLat = 38.897;
    const expectedLng = -77.006;
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

  it('speaks nearby places', () => {
    cy.get('button').click()

    const expectedFirstCallout = "Blue Bottle Coffee, 55 feet";

    cy.wait(2000)  // Allow time for tile data to load
    cy.get('#btn_near_me').click()
    cy.get('@speak').should('have.been.calledWithMatch', (utterance) => {
      return utterance.text === expectedFirstCallout;
    });
  })
})
