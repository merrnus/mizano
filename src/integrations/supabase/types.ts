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
      cetele_kayit: {
        Row: {
          created_at: string
          id: string
          miktar: number
          not_metni: string | null
          sablon_id: string
          tarih: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          miktar?: number
          not_metni?: string | null
          sablon_id: string
          tarih: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          miktar?: number
          not_metni?: string | null
          sablon_id?: string
          tarih?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cetele_kayit_sablon_id_fkey"
            columns: ["sablon_id"]
            isOneToOne: false
            referencedRelation: "cetele_sablon"
            referencedColumns: ["id"]
          },
        ]
      }
      cetele_sablon: {
        Row: {
          ad: string
          aktif: boolean
          alan: Database["public"]["Enums"]["cetele_alan"]
          birim: Database["public"]["Enums"]["cetele_birim"]
          created_at: string
          hedef_deger: number
          hedef_tipi: Database["public"]["Enums"]["cetele_hedef_tipi"]
          id: string
          notlar: string | null
          siralama: number
          uc_aylik_baslangic: string | null
          uc_aylik_hedef: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad: string
          aktif?: boolean
          alan?: Database["public"]["Enums"]["cetele_alan"]
          birim: Database["public"]["Enums"]["cetele_birim"]
          created_at?: string
          hedef_deger?: number
          hedef_tipi?: Database["public"]["Enums"]["cetele_hedef_tipi"]
          id?: string
          notlar?: string | null
          siralama?: number
          uc_aylik_baslangic?: string | null
          uc_aylik_hedef?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad?: string
          aktif?: boolean
          alan?: Database["public"]["Enums"]["cetele_alan"]
          birim?: Database["public"]["Enums"]["cetele_birim"]
          created_at?: string
          hedef_deger?: number
          hedef_tipi?: Database["public"]["Enums"]["cetele_hedef_tipi"]
          id?: string
          notlar?: string | null
          siralama?: number
          uc_aylik_baslangic?: string | null
          uc_aylik_hedef?: number | null
          updated_at?: string
          user_id?: string
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
      cetele_alan: "maneviyat" | "akademi" | "dunyevi" | "kisisel"
      cetele_birim: "sayfa" | "adet" | "dakika" | "ikili"
      cetele_hedef_tipi: "gunluk" | "haftalik" | "esnek"
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
      cetele_alan: ["maneviyat", "akademi", "dunyevi", "kisisel"],
      cetele_birim: ["sayfa", "adet", "dakika", "ikili"],
      cetele_hedef_tipi: ["gunluk", "haftalik", "esnek"],
    },
  },
} as const
