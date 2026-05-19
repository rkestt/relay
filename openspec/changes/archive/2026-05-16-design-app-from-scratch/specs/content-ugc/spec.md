## ADDED Requirements

### Requirement: User can upload a strategy
The system SHALL allow authenticated users to submit a new strategy for a specific map and site.

#### Scenario: Strategy submission
- **WHEN** user fills the strategy form with title, map, site, text description, and tags
- **AND** user attaches at least one image
- **THEN** system compresses the image client-side
- **AND** system queues the submission for validation

### Requirement: Strategy includes image, text, tags, and hotspot
Every strategy submission SHALL contain an image, a text description, at least one gameplay tag, and at least one hotspot coordinate on the 2D map.

#### Scenario: Valid submission
- **WHEN** user submits a strategy with all required fields including a placed hotspot
- **THEN** system accepts the submission and assigns it a pending status

#### Scenario: Invalid submission missing hotspot
- **WHEN** user submits a strategy without placing a hotspot on the map
- **THEN** system rejects the submission and highlights the missing hotspot

### Requirement: User can place hotspot via tap-to-place
The system SHALL display the 2D map during strategy submission and allow the user to tap to place a hotspot marker.

#### Scenario: Tap to place hotspot
- **WHEN** user taps on the 2D map during submission
- **THEN** a marker appears at the tapped location
- **AND** the system stores the coordinate as percentage (0-100) relative to the map image

#### Scenario: Move hotspot
- **WHEN** user taps a different location after placing a marker
- **THEN** the marker moves to the new location
- **AND** the previous coordinate is replaced

### Requirement: Upload works on unstable networks
The system SHALL handle image upload gracefully on poor network conditions.

#### Scenario: Upload on slow network
- **WHEN** user submits a strategy on a 3G or unstable connection
- **THEN** system compresses the image to under 500KB before upload
- **AND** system shows an upload progress indicator
- **AND** if the upload fails, system allows retry without losing form data
