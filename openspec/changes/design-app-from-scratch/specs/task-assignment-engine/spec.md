## ADDED Requirements

### Requirement: System assigns tasks based on operator tags
The system SHALL generate a prioritized list of tasks for the user based on the selected operator's tags and the selected site.

#### Scenario: Task generation for Hard Breacher
- **WHEN** user selects an operator tagged as "Hard Breacher" on a specific site
- **THEN** the system assigns tasks such as "Open reinforced wall at X" and "Place exothermic charge at Y"
- **AND** tasks are ordered by priority for that archetype on the selected site

### Requirement: System prevents duplicate task assignments via server-side conflict resolution
The system SHALL ensure that the same strategy is not assigned to multiple users in the same lobby session using a server-side first-write-wins mechanism.

#### Scenario: Conflict prevention
- **WHEN** two users select operators whose tag-based tasks overlap
- **THEN** the server resolves the conflict atomically in a database transaction
- **AND** the first user whose selection is locked receives the highest-priority strategy
- **AND** the second user receives alternative strategies for their remaining tags

#### Scenario: Race condition handled
- **WHEN** two users lock their selections simultaneously within milliseconds
- **THEN** the database UNIQUE constraint on task_assignments ensures only one assignment succeeds
- **AND** the failed assignment triggers a retry with the next best strategy

### Requirement: Task output includes 2D map and screenshot
Every assigned task SHALL include a 2D map overlay indicating the macro position and an annotated screenshot showing the technical execution.

#### Scenario: Hybrid task display
- **WHEN** a task is assigned to a user
- **THEN** the task card displays an SVG hotspot on the 2D map at the stored percentage coordinates
- **AND** the task card displays a screenshot image with the exact angle/position

### Requirement: Tasks load within 2 seconds
The system SHALL display assigned tasks to the user within 2 seconds of operator selection.

#### Scenario: Performance under normal network
- **WHEN** user selects an operator on a stable connection
- **THEN** tasks are visible within 2 seconds

#### Scenario: Performance under poor network
- **WHEN** user selects an operator on a slow or unstable connection
- **THEN** the client-side lookup is instant from cached strategy data
- **AND** the server-side conflict resolution adds at most 300ms round-trip
- **AND** tasks are visible within 2 seconds total
