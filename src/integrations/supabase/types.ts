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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
        }
        Relationships: []
      }
      ai_cache: {
        Row: {
          action: string
          cache_key: string
          created_at: string
          expires_at: string | null
          id: string
          result: Json
        }
        Insert: {
          action: string
          cache_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          result: Json
        }
        Update: {
          action?: string
          cache_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          result?: Json
        }
        Relationships: []
      }
      approved_emails: {
        Row: {
          bloqueado: boolean
          created_at: string
          email: string
          expires_at: string | null
          id: string
          plan: string | null
          sku: string | null
        }
        Insert: {
          bloqueado?: boolean
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          sku?: string | null
        }
        Update: {
          bloqueado?: boolean
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      library_entitlements: {
        Row: {
          created_at: string
          email: string
          id: string
          product_slug: string
          source_sku: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          product_slug: string
          source_sku?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          product_slug?: string
          source_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_entitlements_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "library_products"
            referencedColumns: ["slug"]
          },
        ]
      }
      library_products: {
        Row: {
          active: boolean
          created_at: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          slug?: string
        }
        Relationships: []
      }
      library_sku_products: {
        Row: {
          product_slug: string
          sku: string
        }
        Insert: {
          product_slug: string
          sku: string
        }
        Update: {
          product_slug?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_sku_products_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "library_products"
            referencedColumns: ["slug"]
          },
        ]
      }
      library_volumes: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string
          product_slug: string
          title: string
          updated_at: string
          volume_slug: string
          word_count: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: string
          product_slug: string
          title: string
          updated_at?: string
          volume_slug: string
          word_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          product_slug?: string
          title?: string
          updated_at?: string
          volume_slug?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "library_volumes_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "library_products"
            referencedColumns: ["slug"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          amens: number
          categoria: string
          created_at: string
          id: string
          image_url: string | null
          nome: string
          pedido: string
        }
        Insert: {
          amens?: number
          categoria?: string
          created_at?: string
          id?: string
          image_url?: string | null
          nome?: string
          pedido: string
        }
        Update: {
          amens?: number
          categoria?: string
          created_at?: string
          id?: string
          image_url?: string | null
          nome?: string
          pedido?: string
        }
        Relationships: []
      }
      sku_plans: {
        Row: {
          created_at: string
          months: number
          plan_name: string
          sku: string
        }
        Insert: {
          created_at?: string
          months: number
          plan_name: string
          sku: string
        }
        Update: {
          created_at?: string
          months?: number
          plan_name?: string
          sku?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string
          email: string
          id: string
          tool: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          tool: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          tool?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_email:
        | {
            Args: {
              _admin_email: string
              _admin_password: string
              _new_email: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _admin_email: string
              _admin_password: string
              _months?: number
              _new_email: string
              _plan?: string
            }
            Returns: undefined
          }
      admin_add_library_sku: {
        Args: {
          _admin_email: string
          _admin_password: string
          _product_slug: string
          _sku: string
        }
        Returns: undefined
      }
      admin_cache_stats: {
        Args: { _admin_email: string; _admin_password: string }
        Returns: {
          action: string
          total: number
        }[]
      }
      admin_change_password: {
        Args: {
          _admin_email: string
          _admin_password: string
          _new_password: string
        }
        Returns: undefined
      }
      admin_clear_old_cache: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: number
      }
      admin_dashboard_stats: {
        Args: { _admin_email: string; _admin_password: string }
        Returns: Json
      }
      admin_delete_cache: {
        Args: { _admin_email: string; _admin_password: string; _id: string }
        Returns: undefined
      }
      admin_delete_email: {
        Args: { _admin_email: string; _admin_password: string; _id: string }
        Returns: undefined
      }
      admin_delete_library_sku: {
        Args: { _admin_email: string; _admin_password: string; _sku: string }
        Returns: undefined
      }
      admin_delete_sku_plan: {
        Args: { _admin_email: string; _admin_password: string; _sku: string }
        Returns: undefined
      }
      admin_grant_library_access: {
        Args: {
          _admin_email: string
          _admin_password: string
          _email: string
          _product_slug: string
        }
        Returns: undefined
      }
      admin_list_cache: {
        Args: {
          _admin_email: string
          _admin_password: string
          _limit?: number
          _offset?: number
          _search?: string
        }
        Returns: {
          action: string
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          total_count: number
        }[]
      }
      admin_list_emails: {
        Args: { _admin_email: string; _admin_password: string }
        Returns: {
          bloqueado: boolean
          created_at: string
          email: string
          id: string
        }[]
      }
      admin_list_emails_paginated: {
        Args: {
          _admin_email: string
          _admin_password: string
          _limit?: number
          _offset?: number
          _search?: string
        }
        Returns: {
          bloqueado: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          plan: string
          sku: string
          total_count: number
        }[]
      }
      admin_list_library_entitlements: {
        Args: {
          _admin_email: string
          _admin_password: string
          _limit?: number
          _offset?: number
          _search?: string
        }
        Returns: {
          created_at: string
          email: string
          id: string
          product_slug: string
          source_sku: string
          total_count: number
        }[]
      }
      admin_list_library_skus: {
        Args: { _admin_email: string; _admin_password: string }
        Returns: {
          product_slug: string
          sku: string
        }[]
      }
      admin_list_sku_plans: {
        Args: { _admin_email: string; _admin_password: string }
        Returns: {
          created_at: string
          months: number
          plan_name: string
          sku: string
        }[]
      }
      admin_retention_stats: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: Json
      }
      admin_revoke_library_access: {
        Args: { _admin_email: string; _admin_password: string; _id: string }
        Returns: undefined
      }
      admin_toggle_block: {
        Args: {
          _admin_email: string
          _admin_password: string
          _bloqueado: boolean
          _id: string
        }
        Returns: undefined
      }
      admin_top_tools: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: {
          tool: string
          uses: number
        }[]
      }
      admin_top_users: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: {
          email: string
          last_seen: string
          uses: number
        }[]
      }
      admin_update_email: {
        Args: {
          _admin_email: string
          _admin_password: string
          _id: string
          _new_email: string
        }
        Returns: undefined
      }
      admin_upsert_sku_plan: {
        Args: {
          _admin_email: string
          _admin_password: string
          _months: number
          _plan_name: string
          _sku: string
        }
        Returns: undefined
      }
      admin_usage_by_day: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: {
          day: string
          uses: number
        }[]
      }
      admin_usage_by_hour: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: {
          hour: number
          uses: number
        }[]
      }
      admin_usage_by_weekday: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: {
          uses: number
          weekday: number
        }[]
      }
      admin_user_growth: {
        Args: { _admin_email: string; _admin_password: string; _days?: number }
        Returns: {
          day: string
          new_users: number
        }[]
      }
      has_library_access: {
        Args: { _email: string; _product_slug: string }
        Returns: boolean
      }
      log_tool_usage: {
        Args: { _email: string; _tool: string }
        Returns: undefined
      }
      verify_admin: {
        Args: { _email: string; _password: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
