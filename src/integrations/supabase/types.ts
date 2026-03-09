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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_videos: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          unlock_fee: number
          updated_at: string | null
          views: number | null
          youtube_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          unlock_fee?: number
          updated_at?: string | null
          views?: number | null
          youtube_url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          unlock_fee?: number
          updated_at?: string | null
          views?: number | null
          youtube_url?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          sender_id: string
          type: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          sender_id: string
          type?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          lga: string
          money_balance: number | null
          name: string
          points: number | null
          referral_code: string | null
          referred_by: string | null
          state: string
          updated_at: string | null
          ward: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          lga: string
          money_balance?: number | null
          name: string
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          state: string
          updated_at?: string | null
          ward: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          lga?: string
          money_balance?: number | null
          name?: string
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          state?: string
          updated_at?: string | null
          ward?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recitations: {
        Row: {
          created_at: string | null
          id: string
          mistakes: number | null
          recording_url: string | null
          score: number
          user_id: string
          video_id: string
          word_results: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mistakes?: number | null
          recording_url?: string | null
          score?: number
          user_id: string
          video_id: string
          word_results?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mistakes?: number | null
          recording_url?: string | null
          score?: number
          user_id?: string
          video_id?: string
          word_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recitations_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_pins: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_redeemed: boolean | null
          pin_code: string
          redeemed_at: string | null
          redeemed_by: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_redeemed?: boolean | null
          pin_code: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          value?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_redeemed?: boolean | null
          pin_code?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "redemption_pins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_pins_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_likes: {
        Row: {
          created_at: string | null
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_likes_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_public: boolean | null
          likes: number | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
          video_url: string
          views: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_public?: boolean | null
          likes?: number | null
          thumbnail_url?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
          video_url: string
          views?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_public?: boolean | null
          likes?: number | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          video_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "streams_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      surahs: {
        Row: {
          arabic_text: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          juz: number | null
          name_arabic: string
          name_english: string
          surah_number: number
          total_ayahs: number | null
          transliteration: string | null
          updated_at: string | null
        }
        Insert: {
          arabic_text: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          juz?: number | null
          name_arabic: string
          name_english: string
          surah_number: number
          total_ayahs?: number | null
          transliteration?: string | null
          updated_at?: string | null
        }
        Update: {
          arabic_text?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          juz?: number | null
          name_arabic?: string
          name_english?: string
          surah_number?: number
          total_ayahs?: number | null
          transliteration?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string | null
          id: string
          points_amount: number | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          points_amount?: number | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points_amount?: number | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_video_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          learning_video_id: string
          updated_at: string | null
          user_id: string
          watch_progress: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          learning_video_id: string
          updated_at?: string | null
          user_id: string
          watch_progress?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          learning_video_id?: string
          updated_at?: string | null
          user_id?: string
          watch_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_learning_video_id_fkey"
            columns: ["learning_video_id"]
            isOneToOne: false
            referencedRelation: "learning_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          arabic_text: string
          created_at: string | null
          created_by: string | null
          description: string | null
          duration: number | null
          id: string
          thumbnail_url: string | null
          title: string
          unlock_fee: number | null
          updated_at: string | null
          video_url: string
          views: number | null
        }
        Insert: {
          arabic_text: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          unlock_fee?: number | null
          updated_at?: string | null
          video_url: string
          views?: number | null
        }
        Update: {
          arabic_text?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          unlock_fee?: number | null
          updated_at?: string | null
          video_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_code: string | null
          bank_name: string
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          bank_code?: string | null
          bank_name: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_code?: string | null
          bank_name?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      redeem_pin: {
        Args: { _pin_code: string; _user_id: string }
        Returns: Json
      }
      unlock_video: {
        Args: { _user_id: string; _video_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
