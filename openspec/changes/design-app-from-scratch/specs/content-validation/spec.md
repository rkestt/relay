## ADDED Requirements

### Requirement: Submitted strategies enter validation queue with secure tokens
The system SHALL send every new strategy submission to an external validation gateway with HMAC-signed approve/reject URLs.

#### Scenario: Discord gateway notification
- **WHEN** a user submits a strategy
- **THEN** system generates two cryptographically signed tokens (approve and reject) using HMAC-SHA256
- **AND** system stores a SHA-256 hash of the tokens in the validation_queue table
- **AND** system posts a message to the configured Discord webhook with strategy metadata, image URL, and signed approve/reject links
- **AND** the links expire after 7 days

### Requirement: Validator can approve or reject via signed URL
The system SHALL expose secure endpoints that verify HMAC signatures before applying approve or reject actions.

#### Scenario: Approve strategy with valid token
- **WHEN** validator clicks the approve link from the Discord message
- **THEN** system verifies the HMAC signature using timing-safe comparison
- **AND** system checks the token hash exists in validation_queue and has not expired
- **AND** system marks the strategy as approved
- **AND** system removes the entry from validation_queue (one-time use)
- **AND** the strategy becomes visible to all users in the task assignment engine

#### Scenario: Reject strategy with valid token
- **WHEN** validator clicks the reject link from the Discord message
- **THEN** system verifies the HMAC signature
- **AND** system marks the strategy as rejected
- **AND** system removes the entry from validation_queue

#### Scenario: Invalid or tampered token
- **WHEN** someone attempts to access the validation endpoint with a forged or expired token
- **THEN** system returns 403 Forbidden without modifying any strategy status

### Requirement: Approved strategies become visible to users
Only strategies with "approved" status SHALL be eligible for task assignment and browsing.

#### Scenario: Approved content availability
- **WHEN** a strategy is approved by a validator
- **THEN** it appears in the strategy browser for its map/site
- **AND** it becomes eligible for the tag-based task assignment engine
