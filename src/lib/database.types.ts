export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_points: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          name: string
          town_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          town_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_points_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          name: string
          owner_profile_id: string | null
          town_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          owner_profile_id?: string | null
          town_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          owner_profile_id?: string | null
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinators: {
        Row: {
          created_at: string | null
          display_name: string
          earnings: Json | null
          id: string
          phone: string | null
          status: string | null
          town_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string
          earnings?: Json | null
          id: string
          phone?: string | null
          status?: string | null
          town_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          earnings?: Json | null
          id?: string
          phone?: string | null
          status?: string | null
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coordinators_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordinators_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_profiles: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          sections: Json | null
          status: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          sections?: Json | null
          status?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          sections?: Json | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          title: string
          town_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          title: string
          town_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          title?: string
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          created_at: string | null
          deadline_date: string | null
          id: string
          metadata: Json | null
          source: string | null
          title: string
          town_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          deadline_date?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title: string
          town_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          deadline_date?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title?: string
          town_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_offers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          offer_type: string | null
          partner_id: string | null
          town_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          offer_type?: string | null
          partner_id?: string | null
          town_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          offer_type?: string | null
          partner_id?: string | null
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_offers_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          facts: Json | null
          field_visibility: Json | null
          id: string
          town_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          facts?: Json | null
          field_visibility?: Json | null
          id: string
          town_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          facts?: Json | null
          field_visibility?: Json | null
          id?: string
          town_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string
          price_range: string | null
          title: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          price_range?: string | null
          title?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          price_range?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string
          media_url: string | null
          title: string
          town_id: string | null
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          title: string
          town_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          title?: string
          town_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      town_metrics: {
        Row: {
          active_coordinators: number | null
          active_signals: number | null
          id: string
          open_opportunities: number | null
          town_id: string | null
          updated_at: string | null
          youth_mapped: number | null
        }
        Insert: {
          active_coordinators?: number | null
          active_signals?: number | null
          id?: string
          open_opportunities?: number | null
          town_id?: string | null
          updated_at?: string | null
          youth_mapped?: number | null
        }
        Update: {
          active_coordinators?: number | null
          active_signals?: number | null
          id?: string
          open_opportunities?: number | null
          town_id?: string | null
          updated_at?: string | null
          youth_mapped?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "town_metrics_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
        ]
      }
      town_signals: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          title: string | null
          town_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string | null
          town_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          title?: string | null
          town_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "town_signals_town_id_fkey"
            columns: ["town_id"]
            isOneToOne: false
            referencedRelation: "towns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "town_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      towns: {
        Row: {
          archetype: string | null
          coordinator_id: string | null
          created_at: string | null
          id: string
          name: string
          population_estimate: number | null
          province_id: string | null
          slug: string
        }
        Insert: {
          archetype?: string | null
          coordinator_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          population_estimate?: number | null
          province_id?: string | null
          slug: string
        }
        Update: {
          archetype?: string | null
          coordinator_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          population_estimate?: number | null
          province_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "towns_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "towns_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
