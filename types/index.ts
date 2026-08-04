// ──────────────────────────────────────────────
// Database types — auto-generated from live DB schema
// Regenerate: node scripts/generate-types.mjs
// ──────────────────────────────────────────────

export interface Lobby {
  id: string;
  room_code: string;
  leader_id: string;
  status: "active" | "closed" | null;
  created_at: string | null;
  updated_at: string | null;
  starting_side: "attacker" | "defender" | null;
  phase: "waiting" | "playing" | "closed" | null;
  map_id: string | null;
}

export interface LobbyBan {
  id: string;
  lobby_id: string | null;
  operator_id: string | null;
  side: "attacker" | "defender" | null;
  round_id: string | null;
  created_at: string | null;
}

export interface LobbyMember {
  id: string;
  lobby_id: string | null;
  user_id: string | null;
  joined_at: string | null;
}

export interface LobbySelection {
  id: string;
  lobby_id: string | null;
  user_id: string | null;
  round_id: string | null;
  map_id: string | null;
  site_id: string | null;
  operator_id: string | null;
  locked_at: string | null;
}

export interface Map {
  id: string;
  name: string;
}

export interface OperatorTag {
  id: string;
  operator_id: string | null;
  tag: string;
}

export interface Operator {
  id: string;
  name: string;
  side: "attacker" | "defender" | null;
  icon_url: string | null;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export interface Round {
  id: string;
  lobby_id: string | null;
  round_number: number;
  status: "active" | "completed" | null;
  created_at: string | null;
  team_side: "attacker" | "defender" | null;
  winner_side: "attacker" | "defender" | null;
}

export interface Site {
  id: string;
  map_id: string | null;
  name: string;
  floor: string | null;
}

export interface StrategyHotspot {
  id: string;
  strategy_id: string | null;
  x_percent: number;
  y_percent: number;
  label: string | null;
  image_id: string | null;
}

export interface StrategyImage {
  id: string;
  strategy_id: string;
  image_url: string;
  sort_order: number;
  caption: string | null;
  created_at: string | null;
}

export interface StrategyTag {
  id: string;
  strategy_id: string | null;
  tag: string;
}

export interface StrategyTemplate {
  id: string;
  map_id: string | null;
  site_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  status: "pending" | "approved" | "rejected" | null;
  created_by: string | null;
  created_at: string | null;
  operator_id: string | null;
  side: "attacker" | "defender" | null;
}

export interface TaskAssignment {
  id: string;
  lobby_id: string | null;
  user_id: string | null;
  round_id: string | null;
  strategy_id: string | null;
  assigned_at: string | null;
}

export interface TaskVote {
  id: string;
  task_assignment_id: string;
  user_id: string;
  vote_type: "up" | "down";
  created_at: string | null;
}

export interface StrategyOperator {
  strategy_id: string;
  operator_id: string;
}

export interface ValidationQueueItem {
  id: string;
  strategy_id: string | null;
  token_hash: string;
  action: string;
  expires_at: string;
  used_at: string | null;
  created_at: string | null;
}

// ── Virtual / computed fields ──

export interface TaskAssignmentWithVotes extends TaskAssignment {
  upvotes?: number;
  downvotes?: number;
  user_vote?: "up" | "down" | null;
}

export interface StrategyTemplateWithRelations extends StrategyTemplate {
  images?: StrategyImage[];
  strategy_tags?: StrategyTag[];
  strategy_hotspots?: StrategyHotspot[];
  strategy_operators?: StrategyOperator[];
}
