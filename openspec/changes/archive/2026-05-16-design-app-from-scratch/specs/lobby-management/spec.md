## ADDED Requirements

### Requirement: User can create a lobby
The system SHALL allow a user to create a new lobby and receive a unique 6-character room code generated server-side.

#### Scenario: Successful lobby creation
- **WHEN** user taps "Create Lobby"
- **THEN** system calls the server-side API to generate a room code
- **AND** the server generates a 6-character alphanumeric code with ambiguous characters removed (no 0/O, 1/I/l)
- **AND** the server inserts the lobby into the database with a UNIQUE constraint on room_code
- **AND** on the rare collision, the server retries automatically up to 5 times
- **AND** the client receives and stores the room code in local storage for rejoin

### Requirement: User can join a lobby with room code
The system SHALL allow a user to join an existing lobby by entering its 6-character room code.

#### Scenario: Successful join
- **WHEN** user enters a valid 6-character room code and taps "Join"
- **THEN** system adds the user to the lobby member list
- **AND** system stores the room code in local storage

#### Scenario: Invalid room code
- **WHEN** user enters a room code that does not exist
- **THEN** system displays an error message indicating the room was not found

### Requirement: Lobby persists across sessions
The system SHALL reconnect the user to their current lobby automatically on app load if a valid room code is present in local storage.

#### Scenario: Auto-rejoin on app launch
- **WHEN** user opens the app and local storage contains a room code
- **THEN** system attempts to rejoin the corresponding lobby
- **AND** if the lobby still exists and is active, the user is restored to the member list
- **AND** if the lobby is closed, system shows "This lobby has expired" and clears local storage

### Requirement: User can leave a lobby
The system SHALL allow a user to leave the current lobby, clearing the persisted room code.

#### Scenario: Leave lobby
- **WHEN** user taps "Leave Lobby"
- **THEN** system removes the user from the lobby member list
- **AND** system clears the room code from local storage

### Requirement: Stale lobbies are cleaned up
The system SHALL automatically mark inactive lobbies as closed after 24 hours and delete them after 7 days.

#### Scenario: Lobby expiration
- **WHEN** a lobby has had no activity for 24 hours
- **THEN** a scheduled job marks the lobby status as 'closed'
- **AND** members attempting to rejoin see "This lobby has expired"
