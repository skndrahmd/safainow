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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      booking_custom_services: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          price_at_booking: number
          service_id: string
          service_name_en: string
          service_name_ur: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          price_at_booking: number
          service_id: string
          service_name_en: string
          service_name_ur: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          price_at_booking?: number
          service_id?: string
          service_name_en?: string
          service_name_ur?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_custom_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_custom_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_packages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          package_id: string
          package_name_en: string
          package_name_ur: string
          package_type: Database["public"]["Enums"]["package_type"]
          price_at_booking: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          package_id: string
          package_name_en: string
          package_name_ur: string
          package_type: Database["public"]["Enums"]["package_type"]
          price_at_booking: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          package_id?: string
          package_name_en?: string
          package_name_ur?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          price_at_booking?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_packages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_timeline: {
        Row: {
          actor_id: string | null
          actor_type: string
          booking_id: string
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          booking_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          booking_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          address: string
          address_lat: number | null
          address_lng: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cash_collected_at: string | null
          completed_at: string | null
          created_at: string
          customer_feedback:
            | Database["public"]["Enums"]["customer_feedback"]
            | null
          customer_id: string
          id: string
          on_route_at: string | null
          partner_id: string | null
          reached_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          work_in_progress_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          address: string
          address_lat?: number | null
          address_lng?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cash_collected_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_feedback?:
            | Database["public"]["Enums"]["customer_feedback"]
            | null
          customer_id: string
          id?: string
          on_route_at?: string | null
          partner_id?: string | null
          reached_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
          work_in_progress_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          address?: string
          address_lat?: number | null
          address_lng?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cash_collected_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_feedback?:
            | Database["public"]["Enums"]["customer_feedback"]
            | null
          customer_id?: string
          id?: string
          on_route_at?: string | null
          partner_id?: string | null
          reached_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          work_in_progress_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_ledger: {
        Row: {
          booking_id: string
          collected_at: string | null
          commission_amount: number
          created_at: string
          id: string
          partner_amount: number
          partner_id: string
          status: Database["public"]["Enums"]["commission_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          collected_at?: string | null
          commission_amount: number
          created_at?: string
          id?: string
          partner_amount: number
          partner_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          collected_at?: string | null
          commission_amount?: number
          created_at?: string
          id?: string
          partner_amount?: number
          partner_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_ledger_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_text: string
          created_at: string
          custom_label: string | null
          customer_id: string
          id: string
          is_default: boolean
          label: Database["public"]["Enums"]["address_label"]
          lat: number
          lng: number
          updated_at: string
        }
        Insert: {
          address_text: string
          created_at?: string
          custom_label?: string | null
          customer_id: string
          id?: string
          is_default?: boolean
          label?: Database["public"]["Enums"]["address_label"]
          lat: number
          lng: number
          updated_at?: string
        }
        Update: {
          address_text?: string
          created_at?: string
          custom_label?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: Database["public"]["Enums"]["address_label"]
          lat?: number
          lng?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          profile_picture_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_offers: {
        Row: {
          accepted: boolean | null
          booking_id: string
          id: string
          offered_at: string
          partner_id: string
          responded_at: string | null
        }
        Insert: {
          accepted?: boolean | null
          booking_id: string
          id?: string
          offered_at?: string
          partner_id: string
          responded_at?: string | null
        }
        Update: {
          accepted?: boolean | null
          booking_id?: string
          id?: string
          offered_at?: string
          partner_id?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      package_services: {
        Row: {
          created_at: string
          id: string
          package_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_services_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description_en: string
          description_ur: string
          id: string
          is_active: boolean
          name_en: string
          name_ur: string
          price: number
          sort_order: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string
          description_ur?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_ur: string
          price: number
          sort_order?: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_ur?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_ur?: string
          price?: number
          sort_order?: number
          type?: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          auth_user_id: string | null
          cnic_number: string | null
          cnic_picture_url: string | null
          created_at: string
          expo_push_token: string | null
          full_name: string
          id: string
          is_active: boolean
          is_available: boolean
          location: unknown
          passcode_hash: string
          phone: string
          profile_picture_url: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          cnic_number?: string | null
          cnic_picture_url?: string | null
          created_at?: string
          expo_push_token?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          location?: unknown
          passcode_hash: string
          phone: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          cnic_number?: string | null
          cnic_picture_url?: string | null
          created_at?: string
          expo_push_token?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          location?: unknown
          passcode_hash?: string
          phone?: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_ur: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_ur: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_ur?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_nearby_partners: {
        Args: {
          booking_lat: number
          booking_lng: number
          radius_metres: number
        }
        Returns: {
          expo_push_token: string
          full_name: string
          id: string
        }[]
      }
    }
    Enums: {
      address_label: "home" | "work" | "parents_house" | "other"
      booking_status:
        | "pending"
        | "accepted"
        | "on_route"
        | "reached"
        | "work_in_progress"
        | "completed"
        | "cash_collected"
        | "cancelled_by_customer"
        | "cancelled_by_partner"
        | "cancelled_by_admin"
      commission_status: "owed" | "collected"
      customer_feedback: "positive" | "negative"
      package_type: "cleaning" | "standalone" | "custom"
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
      address_label: ["home", "work", "parents_house", "other"],
      booking_status: [
        "pending",
        "accepted",
        "on_route",
        "reached",
        "work_in_progress",
        "completed",
        "cash_collected",
        "cancelled_by_customer",
        "cancelled_by_partner",
        "cancelled_by_admin",
      ],
      commission_status: ["owed", "collected"],
      customer_feedback: ["positive", "negative"],
      package_type: ["cleaning", "standalone", "custom"],
    },
  },
} as const
