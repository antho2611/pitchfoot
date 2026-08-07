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
      applications: {
        Row: {
          club_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          player_id: string
          status: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          player_id: string
          status?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          championship: string | null
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          description: string | null
          history: string | null
          id: string
          is_premium: boolean
          is_verified: boolean
          latitude: number | null
          level: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          social_links: string | null
          stadium: string | null
          website: string | null
        }
        Insert: {
          championship?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          history?: string | null
          id: string
          is_premium?: boolean
          is_verified?: boolean
          latitude?: number | null
          level?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          social_links?: string | null
          stadium?: string | null
          website?: string | null
        }
        Update: {
          championship?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          history?: string | null
          id?: string
          is_premium?: boolean
          is_verified?: boolean
          latitude?: number | null
          level?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          social_links?: string | null
          stadium?: string | null
          website?: string | null
        }
        Relationships: []
      }
      coach_annonces: {
        Row: {
          capacity: number | null
          city: string | null
          coach_id: string
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          price_info: string | null
          reserved_count: number
          session_date: string
          session_type: Database["public"]["Enums"]["coach_session_type"]
          start_time: string | null
          status: Database["public"]["Enums"]["coach_listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          price_info?: string | null
          reserved_count?: number
          session_date: string
          session_type?: Database["public"]["Enums"]["coach_session_type"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["coach_listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          city?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          price_info?: string | null
          reserved_count?: number
          session_date?: string
          session_type?: Database["public"]["Enums"]["coach_session_type"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["coach_listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_annonces_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "preparateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_reservations: {
        Row: {
          annonce_id: string
          coach_id: string
          created_at: string
          id: string
          message: string | null
          player_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          annonce_id: string
          coach_id: string
          created_at?: string
          id?: string
          message?: string | null
          player_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          annonce_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          message?: string | null
          player_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_reservations_annonce_id_fkey"
            columns: ["annonce_id"]
            isOneToOne: false
            referencedRelation: "coach_annonces"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_reviews: {
        Row: {
          author_id: string
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
        }
        Insert: {
          author_id: string
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "preparateurs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: []
      }
      ebook_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          ebook_id: string
          id: string
          provider: string | null
          provider_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          ebook_id: string
          id?: string
          provider?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          ebook_id?: string
          id?: string
          provider?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebook_purchases_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          category: string
          content_path: string | null
          content_url: string | null
          cover_url: string | null
          created_at: string
          description: string
          id: string
          is_free: boolean
          is_published: boolean
          preview_text: string | null
          price_cents: number
          slug: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content_path?: string | null
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_free?: boolean
          is_published?: boolean
          preview_text?: string | null
          price_cents?: number
          slug: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_path?: string | null
          content_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_free?: boolean
          is_published?: boolean
          preview_text?: string | null
          price_cents?: number
          slug?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          availability_required:
            | Database["public"]["Enums"]["availability_status"]
            | null
          championship: string | null
          city: string | null
          club_id: string
          created_at: string
          description: string | null
          id: string
          is_open: boolean
          level: string | null
          max_age: number | null
          min_age: number | null
          position: string | null
          season: string | null
          title: string
        }
        Insert: {
          availability_required?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          championship?: string | null
          city?: string | null
          club_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          level?: string | null
          max_age?: number | null
          min_age?: number | null
          position?: string | null
          season?: string | null
          title: string
        }
        Update: {
          availability_required?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          championship?: string | null
          city?: string | null
          club_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_open?: boolean
          level?: string | null
          max_age?: number | null
          min_age?: number | null
          position?: string | null
          season?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          assists: number
          clean_sheets: number
          created_at: string
          duels_won: number
          goals: number
          id: string
          interceptions: number
          matches: number
          minutes: number
          pass_accuracy: number
          player_id: string
          recoveries: number
          saves: number
          season: string
          shots_on_target: number
          tackles: number
        }
        Insert: {
          assists?: number
          clean_sheets?: number
          created_at?: string
          duels_won?: number
          goals?: number
          id?: string
          interceptions?: number
          matches?: number
          minutes?: number
          pass_accuracy?: number
          player_id: string
          recoveries?: number
          saves?: number
          season?: string
          shots_on_target?: number
          tackles?: number
        }
        Update: {
          assists?: number
          clean_sheets?: number
          created_at?: string
          duels_won?: number
          goals?: number
          id?: string
          interceptions?: number
          matches?: number
          minutes?: number
          pass_accuracy?: number
          player_id?: string
          recoveries?: number
          saves?: number
          season?: string
          shots_on_target?: number
          tackles?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          agent: string | null
          ai_summary: string | null
          availability: Database["public"]["Enums"]["availability_status"]
          bio: string | null
          birth_date: string | null
          championship: string | null
          city: string | null
          country: string | null
          created_at: string
          current_club: string | null
          cv_url: string | null
          experience_years: number
          first_name: string
          gallery_urls: string[]
          height_cm: number | null
          id: string
          is_premium: boolean
          last_name: string
          level: string | null
          main_position: string | null
          nationality: string | null
          photo_url: string | null
          previous_clubs: string | null
          secondary_positions: string[]
          strong_foot: string | null
          trophies: string | null
          updated_at: string
          video_urls: string[]
          views_count: number
          weight_kg: number | null
        }
        Insert: {
          agent?: string | null
          ai_summary?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          bio?: string | null
          birth_date?: string | null
          championship?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_club?: string | null
          cv_url?: string | null
          experience_years?: number
          first_name?: string
          gallery_urls?: string[]
          height_cm?: number | null
          id: string
          is_premium?: boolean
          last_name?: string
          level?: string | null
          main_position?: string | null
          nationality?: string | null
          photo_url?: string | null
          previous_clubs?: string | null
          secondary_positions?: string[]
          strong_foot?: string | null
          trophies?: string | null
          updated_at?: string
          video_urls?: string[]
          views_count?: number
          weight_kg?: number | null
        }
        Update: {
          agent?: string | null
          ai_summary?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          bio?: string | null
          birth_date?: string | null
          championship?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_club?: string | null
          cv_url?: string | null
          experience_years?: number
          first_name?: string
          gallery_urls?: string[]
          height_cm?: number | null
          id?: string
          is_premium?: boolean
          last_name?: string
          level?: string | null
          main_position?: string | null
          nationality?: string | null
          photo_url?: string | null
          previous_clubs?: string | null
          secondary_positions?: string[]
          strong_foot?: string | null
          trophies?: string | null
          updated_at?: string
          video_urls?: string[]
          views_count?: number
          weight_kg?: number | null
        }
        Relationships: []
      }
      preparateurs: {
        Row: {
          bio: string | null
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          full_name: string
          headline: string | null
          id: string
          is_premium: boolean
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          phone: string | null
          photo_url: string | null
          price_info: string | null
          qualifications: string | null
          radius_km: number
          specialties: string[]
          updated_at: string
          views_count: number
          website: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          headline?: string | null
          id: string
          is_premium?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          photo_url?: string | null
          price_info?: string | null
          qualifications?: string | null
          radius_km?: number
          specialties?: string[]
          updated_at?: string
          views_count?: number
          website?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          headline?: string | null
          id?: string
          is_premium?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          photo_url?: string | null
          price_info?: string | null
          qualifications?: string | null
          radius_km?: number
          specialties?: string[]
          updated_at?: string
          views_count?: number
          website?: string | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          player_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["app_role"]
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          profile_completed: boolean
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["app_role"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          profile_completed?: boolean
        }
        Update: {
          account_type?: Database["public"]["Enums"]["app_role"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          profile_completed?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saved_players: {
        Row: {
          club_id: string
          created_at: string
          id: string
          player_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          player_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      search_usage: {
        Row: {
          created_at: string
          id: string
          period: string
          search_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period?: string
          search_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period?: string
          search_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          key: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          key: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          key?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_cents: number
          cancel_at_period_end: boolean
          created_at: string
          currency: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          id?: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_search: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "player" | "club" | "coach"
      availability_status:
        | "recherche_club"
        | "immediate"
        | "fin_saison"
        | "essai"
        | "ouvert"
      coach_listing_status: "active" | "complete" | "expiree"
      coach_session_type: "collective" | "individuelle"
      reservation_status: "en_attente" | "acceptee" | "refusee" | "annulee"
      subscription_plan: "player_premium" | "club_premium" | "coach_premium"
      subscription_status:
        | "active"
        | "trialing"
        | "canceled"
        | "expired"
        | "pending"
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
    Enums: {
      app_role: ["admin", "player", "club", "coach"],
      availability_status: [
        "recherche_club",
        "immediate",
        "fin_saison",
        "essai",
        "ouvert",
      ],
      coach_listing_status: ["active", "complete", "expiree"],
      coach_session_type: ["collective", "individuelle"],
      reservation_status: ["en_attente", "acceptee", "refusee", "annulee"],
      subscription_plan: ["player_premium", "club_premium", "coach_premium"],
      subscription_status: [
        "active",
        "trialing",
        "canceled",
        "expired",
        "pending",
      ],
    },
  },
} as const
