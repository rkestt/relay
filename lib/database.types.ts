export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      lobbies: {
        Row: {
          created_at: string | null
          id: string
          leader_id: string
          map_id: string | null
          phase: string
          room_code: string
          starting_side: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leader_id: string
          map_id?: string | null
          phase?: string
          room_code: string
          starting_side?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leader_id?: string
          map_id?: string | null
          phase?: string
          room_code?: string
          starting_side?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lobbies_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobbies_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_bans: {
        Row: {
          created_at: string | null
          id: string
          lobby_id: string
          operator_id: string
          round_id: string
          side: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lobby_id: string
          operator_id: string
          round_id: string
          side: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lobby_id?: string
          operator_id?: string
          round_id?: string
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_bans_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_bans_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_bans_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_members: {
        Row: {
          id: string
          joined_at: string | null
          lobby_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          lobby_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          lobby_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_members_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_selections: {
        Row: {
          id: string
          lobby_id: string
          locked_at: string | null
          map_id: string | null
          operator_id: string | null
          round_id: string
          site_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          lobby_id: string
          locked_at?: string | null
          map_id?: string | null
          operator_id?: string | null
          round_id: string
          site_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          lobby_id?: string
          locked_at?: string | null
          map_id?: string | null
          operator_id?: string | null
          round_id?: string
          site_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_selections_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_selections_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_selections_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_selections_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_selections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maps: {
        Row: {
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          id: string
          image_url?: string | null
          name: string
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          icon_url: string | null
          id: string
          name: string
          side: string
        }
        Insert: {
          icon_url?: string | null
          id: string
          name: string
          side: string
        }
        Update: {
          icon_url?: string | null
          id?: string
          name?: string
          side?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          created_at: string | null
          id: string
          lobby_id: string
          round_number: number
          status: string | null
          team_side: string | null
          winner_side: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lobby_id: string
          round_number: number
          status?: string | null
          team_side?: string | null
          winner_side?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lobby_id?: string
          round_number?: number
          status?: string | null
          team_side?: string | null
          winner_side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          version: string
        }
        Update: {
          applied_at?: string | null
          version?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          floor: string | null
          id: string
          map_id: string
          name: string
        }
        Insert: {
          floor?: string | null
          id: string
          map_id: string
          name: string
        }
        Update: {
          floor?: string | null
          id?: string
          map_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_hotspots: {
        Row: {
          id: string
          image_id: string | null
          label: string | null
          strategy_id: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          id?: string
          image_id?: string | null
          label?: string | null
          strategy_id: string
          x_percent: number
          y_percent: number
        }
        Update: {
          id?: string
          image_id?: string | null
          label?: string | null
          strategy_id?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_hotspots_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "strategy_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_hotspots_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          sort_order: number
          strategy_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          sort_order?: number
          strategy_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_images_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_operators: {
        Row: {
          id: string
          operator_id: string
          sort_order: number
          strategy_id: string
        }
        Insert: {
          id?: string
          operator_id: string
          sort_order?: number
          strategy_id: string
        }
        Update: {
          id?: string
          operator_id?: string
          sort_order?: number
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_operators_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_operators_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string
          map_id: string | null
          side: string | null
          site_id: string | null
          status: string
          title: string
          usage_count: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url: string
          map_id?: string | null
          side?: string | null
          site_id?: string | null
          status?: string
          title: string
          usage_count?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string
          map_id?: string | null
          side?: string | null
          site_id?: string | null
          status?: string
          title?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "strategy_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_templates_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_templates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          lobby_id: string
          round_id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          lobby_id: string
          round_id: string
          strategy_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          lobby_id?: string
          round_id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_votes: {
        Row: {
          created_at: string | null
          id: string
          task_assignment_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_assignment_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_assignment_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_votes_task_assignment_id_fkey"
            columns: ["task_assignment_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_queue: {
        Row: {
          action: string
          created_at: string | null
          expires_at: string
          id: string
          strategy_id: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          expires_at: string
          id?: string
          strategy_id?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          strategy_id?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_queue_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_lobby_member: { Args: { p_lobby_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

