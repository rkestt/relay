## ADDED Requirements

### Requirement: App is installable as PWA
The system SHALL provide a valid web app manifest and service worker so users can install the application on their device home screen.

#### Scenario: PWA installation
- **WHEN** user visits the app in a supported browser
- **THEN** the browser offers an "Install" option
- **AND** after installation, the app launches in standalone mode without browser chrome

### Requirement: App works offline
The system SHALL cache core static assets and the last loaded lobby state so the app remains functional offline.

#### Scenario: Offline lobby access
- **WHEN** user opens the app without an internet connection
- **THEN** the app loads from cache
- **AND** the last viewed lobby state is displayed (read-only)
- **AND** a clear indicator shows that the user is offline

#### Scenario: Offline task viewing
- **WHEN** user is offline and navigates to assigned tasks
- **THEN** previously cached tasks and map assets are displayed

### Requirement: App is optimized for mobile
The system SHALL be responsive and touch-optimized, with primary design optimized for smartphone screens and secondary support for desktop.

#### Scenario: Mobile touch optimization
- **WHEN** user interacts with the app on a smartphone
- **THEN** all tap targets are at least 44x44 CSS pixels
- **AND** the layout adapts to portrait orientation
- **AND** no horizontal scrolling is required for primary content

#### Scenario: Desktop responsiveness
- **WHEN** user opens the app on a desktop browser
- **THEN** the layout expands to use available width
- **AND** the lobby and task views remain usable with mouse interaction

### Requirement: Graceful degradation when realtime disconnects
The system SHALL continue to function in a degraded mode when the real-time WebSocket connection is lost.

#### Scenario: Realtime disconnected
- **WHEN** the WebSocket connection drops but HTTP API is still available
- **THEN** the app shows a "Live updates paused" indicator
- **AND** the user can still make selections (sent via HTTP POST)
- **AND** the member list shows last-known state
- **AND** automatic reconnection retry with exponential backoff occurs

### Requirement: Graceful degradation when API is unavailable
The system SHALL show a clear error state when the backend API returns errors.

#### Scenario: API down
- **WHEN** the Supabase API returns 5xx errors
- **THEN** the app shows a "Server unavailable" banner
- **AND** the lobby displays cached read-only state
- **AND** create/join buttons are disabled with explanatory message
- **AND** a "Try again" button is available

### Requirement: Graceful degradation when images fail to load
The system SHALL display fallback placeholders when task screenshots or map images fail to load.

#### Scenario: Image load failure
- **WHEN** a task screenshot or map image fails to load
- **THEN** a fallback placeholder with an icon is displayed
- **AND** the task text and description remain readable
