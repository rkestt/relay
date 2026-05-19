## ADDED Requirements

### Requirement: User can select a map
The system SHALL present all available maps and allow the user to select one.

#### Scenario: Map selection
- **WHEN** user taps on a map from the list
- **THEN** the map is marked as selected for the current user
- **AND** the available sites for that map are displayed

### Requirement: User can select a site
The system SHALL display the sites available for the selected map and allow the user to choose one.

#### Scenario: Site selection
- **WHEN** user taps on a site
- **THEN** the site is marked as selected for the current user
- **AND** the operator selection screen is shown

### Requirement: User can select an operator
The system SHALL present operators with their tags/archetypes and allow the user to select one. Operators banned by the lobby leader SHALL NOT be selectable.

#### Scenario: Operator selection
- **WHEN** user taps on an operator card that is not banned
- **THEN** the operator is assigned to the user
- **AND** the system triggers the task assignment engine

#### Scenario: Banned operator selection blocked
- **WHEN** user taps on an operator card that has been banned by the lobby leader
- **THEN** the system prevents the selection
- **AND** the system displays a visual indicator that the operator is banned

### Requirement: Selections synchronize in real time
The system SHALL broadcast any map, site, or operator selection to all lobby members in real time.

#### Scenario: Real-time sync
- **WHEN** a lobby member changes their map, site, or operator selection
- **THEN** all other connected members see the updated selection within 1 second

### Requirement: Operator selections reset between rounds
The system SHALL clear all operator selections when a new round begins while preserving the lobby, map, site, and bans.

#### Scenario: Round reset
- **WHEN** the lobby leader initiates a new round
- **THEN** all operator selections are cleared
- **AND** all assigned tasks are cleared
- **AND** the map, site, and bans remain unchanged
- **AND** members return to the operator selection screen
