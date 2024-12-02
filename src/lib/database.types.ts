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
      content_items: {
        Row: {
          alt_text: string | null
          categories: string[] | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          details: string
          facebook_description: string | null
          id: string
          instagram_caption: string | null
          linkedin_description: string | null
          media_url: string[] | null
          publish_at: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          user_id: string
          x_description: string | null
        }
        Insert: {
          alt_text?: string | null
          categories?: string[] | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          details: string
          facebook_description?: string | null
          id?: string
          instagram_caption?: string | null
          linkedin_description?: string | null
          media_url?: string[] | null
          publish_at?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          x_description?: string | null
        }
        Update: {
          alt_text?: string | null
          categories?: string[] | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          details?: string
          facebook_description?: string | null
          id?: string
          instagram_caption?: string | null
          linkedin_description?: string | null
          media_url?: string[] | null
          publish_at?: string | null
          status?: Database["public"]["Enums"]["content_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          x_description?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          category: string
          content: string
          created_at: string | null
          embedding: string
          id: number
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          embedding: string
          id?: never
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          embedding?: string
          id?: never
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      personas: {
        Row: {
          audience: string | null
          created_at: string
          goals: string | null
          id: string
          introduction: string | null
          style: string | null
          uniqueness: string | null
          updated_at: string
          user_id: string
          value_proposition: string | null
        }
        Insert: {
          audience?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          introduction?: string | null
          style?: string | null
          uniqueness?: string | null
          updated_at?: string
          user_id: string
          value_proposition?: string | null
        }
        Update: {
          audience?: string | null
          created_at?: string
          goals?: string | null
          id?: string
          introduction?: string | null
          style?: string | null
          uniqueness?: string | null
          updated_at?: string
          user_id?: string
          value_proposition?: string | null
        }
        Relationships: []
      }
      user_agent: {
        Row: {
          agent_id: string
          created_at: string | null
          llm_id: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          llm_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          llm_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_auth: {
        Row: {
          created_at: string
          linkedin_access_token: string | null
          twitter_access_token: string | null
          twitter_verification_code: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          linkedin_access_token?: string | null
          twitter_access_token?: string | null
          twitter_verification_code?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          linkedin_access_token?: string | null
          twitter_access_token?: string | null
          twitter_verification_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          is_subscribed: boolean | null
          post_count: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_subscribed?: boolean | null
          post_count?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_subscribed?: boolean | null
          post_count?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          agent_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          linkedin_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          linkedin_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          linkedin_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_entries:
        | {
            Args: {
              query_embedding: string
              match_threshold: number
              match_count: number
            }
            Returns: {
              id: number
              title: string
              content: string
              category: string
              similarity: number
            }[]
          }
        | {
            Args: {
              query_embedding: string
              match_threshold: number
              match_count: number
              p_user_id: string
            }
            Returns: {
              id: number
              title: string
              content: string
              category: string
              similarity: number
            }[]
          }
    }
    Enums: {
      content_status: "draft" | "scheduled" | "published" | "archived"
      content_type:
        | "post"
        | "thread"
        | "article"
        | "video"
        | "image"
        | "carousel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
