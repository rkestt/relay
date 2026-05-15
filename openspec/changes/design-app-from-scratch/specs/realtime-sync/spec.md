## ADDED Requirements

### Requirement: Team selections synchronize in real time
The system SHALL broadcast map, site, and operator selections to all connected lobby members with minimal latency.

#### Scenario: Selection broadcast
- **WHEN** user A selects an operator
- **THEN** user B sees the operator selection update within 1 second under normal network conditions

### Requirement: Lobby state synchronizes in real time
The system SHALL maintain a consistent lobby state (member list, readiness status) across all clients.

#### Scenario: Member join broadcast
- **WHEN** a new user joins the lobby
- **THEN** all existing members see the new member in the list within 1 second

#### Scenario: Member leave broadcast
- **WHEN** a user leaves the lobby
- **THEN** all remaining members see the member removed within 1 second

### Requirement: Client recovers from disconnection with resync
The system SHALL automatically re-establish the real-time connection and resync state if a client loses connectivity.

#### Scenario: Reconnection recovery
- **WHEN** a user's device loses connection and reconnects within 30 seconds
- **THEN** the client rejoins the real-time channel
- **AND** the client immediately fetches the full current lobby state from the server
- **AND** the client replaces its local Zustand state with the server state
- **AND** any missed updates are applied

### Requirement: Periodic heartbeat resync
The system SHALL perform a full state resync every 30 seconds to prevent silent state drift.

#### Scenario: Heartbeat resync
- **WHEN** 30 seconds have elapsed since the last sync
- **THEN** the client fetches the full lobby state from the server
- **AND** if the server state differs from local state, the server state wins
- **AND** the UI updates to reflect the corrected state
