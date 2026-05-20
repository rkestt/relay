// ──────────────────────────────────────────────
// Database types aligned with 00001_setup_schema.sql
// ──────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Map {
  id: string;
  name: string;
  image_url: string | null;
}

export interface Site {
  id: string;
  map_id: string;
  name: string;
  floor: string | null;
}

export interface Operator {
  id: string;
  name: string;
  side: "attacker" | "defender";
  icon_url: string | null;
}

export interface OperatorTag {
  id: string;
  operator_id: string;
  tag: string;
}

export interface Lobby {
  id: string;
  room_code: string;
  leader_id: string;
  status: "active" | "closed";
  phase: "waiting" | "playing" | "closed";
  map_id: string | null;
  starting_side: "attacker" | "defender" | null;
  created_at: string;
  updated_at: string;
}

export interface LobbyMember {
  id: string;
  lobby_id: string;
  user_id: string;
  joined_at: string;
}

export interface Round {
  id: string;
  lobby_id: string;
  round_number: number;
  status: "active" | "completed";
  team_side: "attacker" | "defender" | null;
  created_at: string;
}

export interface LobbyBan {
  id: string;
  lobby_id: string;
  operator_id: string;
  side: "attacker" | "defender";
  round_id: string;
  created_at: string;
}

export interface LobbySelection {
  id: string;
  lobby_id: string;
  user_id: string;
  round_id: string;
  map_id: string | null;
  site_id: string | null;
  operator_id: string | null;
  locked_at: string | null;
}

export interface StrategyTemplate {
  id: string;
  map_id: string | null;
  site_id: string | null;
  title: string;
  description: string | null;
  image_url: string;  // primary image (backward compat)
  images?: StrategyImage[];  // all images
  status: "pending" | "approved" | "rejected";
  created_by: string | null;
  created_at: string;
}

export interface StrategyTag {
  id: string;
  strategy_id: string;
  tag: string;
}

export interface StrategyImage {
  id: string;
  strategy_id: string;
  image_url: string;
  sort_order: number;
  caption: string | null;
  created_at: string;
}

export interface StrategyHotspot {
  id: string;
  strategy_id: string;
  image_id: string | null;  // FK to strategy_images, NULL = primary image
  x_percent: number;
  y_percent: number;
  label: string | null;
}

export interface TaskAssignment {
  id: string;
  lobby_id: string;
  user_id: string;
  round_id: string;
  strategy_id: string;
  assigned_at: string;
}

export interface ValidationQueueItem {
  id: string;
  strategy_id: string;
  token_hash: string;
  action: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}
