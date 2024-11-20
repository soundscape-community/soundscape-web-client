/// <reference types="cypress" />

describe('Fixed-location view', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080/soundscape-web-client/#/detail/38.897596/-77.00635/Blue%20Bottle%20Coffee')
    cy.mockSpeechSynthesis();
    cy.mockGeolocation(38.897596, -77.00635);
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

  it('starts/stops beacon audio', () => {
    cy.get('button').click()

    // No audio before beacon started
    cy.isAudioPlaying().then((isPlaying) => {
      expect(isPlaying).to.be.false;
    });

    // Audio playing after beacon started
    cy.contains('button', 'Start beacon').click()
    cy.isAudioPlaying().then((isPlaying) => {
      expect(isPlaying).to.be.false;
    });

    // Audio stopped after beacon stopped
    cy.contains('button', 'Pause beacon').click()
    cy.isAudioPlaying().then((isPlaying) => {
      expect(isPlaying).to.be.false;
    });
  })
})
