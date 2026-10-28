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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      institutions: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          state: string
          status: Database["public"]["Enums"]["inst_status"]
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name: string
          state?: string
          status?: Database["public"]["Enums"]["inst_status"]
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          state?: string
          status?: Database["public"]["Enums"]["inst_status"]
          type?: string
        }
        Relationships: []
      }
      logbook_entries: {
        Row: {
          activities: string
          created_at: string
          entry_date: string
          id: string
          placement_id: string
          reviewed_at: string | null
          skills: string
          status: Database["public"]["Enums"]["log_status"]
          student_id: string
          supervisor_comment: string
          week_number: number
        }
        Insert: {
          activities: string
          created_at?: string
          entry_date?: string
          id?: string
          placement_id: string
          reviewed_at?: string | null
          skills?: string
          status?: Database["public"]["Enums"]["log_status"]
          student_id: string
          supervisor_comment?: string
          week_number?: number
        }
        Update: {
          activities?: string
          created_at?: string
          entry_date?: string
          id?: string
          placement_id?: string
          reviewed_at?: string | null
          skills?: string
          status?: Database["public"]["Enums"]["log_status"]
          student_id?: string
          supervisor_comment?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "logbook_entries_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "placements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          sector: string
          slots: number
          state: string
        }
        Insert: {
          address?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name: string
          sector?: string
          slots?: number
          state?: string
        }
        Update: {
          address?: string
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          sector?: string
          slots?: number
          state?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          created_at: string
          end_date: string
          id: string
          industry_supervisor_id: string | null
          institution_id: string
          organization_id: string
          reviewer_note: string
          role_title: string
          start_date: string
          status: Database["public"]["Enums"]["placement_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          industry_supervisor_id?: string | null
          institution_id: string
          organization_id: string
          reviewer_note?: string
          role_title?: string
          start_date: string
          status?: Database["public"]["Enums"]["placement_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          industry_supervisor_id?: string | null
          institution_id?: string
          organization_id?: string
          reviewer_note?: string
          role_title?: string
          start_date?: string
          status?: Database["public"]["Enums"]["placement_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_industry_supervisor_id_fkey"
            columns: ["industry_supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          institution_id: string | null
          level: string
          matric_no: string
          phone: string
        }
        Insert: {
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id: string
          institution_id?: string | null
          level?: string
          matric_no?: string
          phone?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          institution_id?: string | null
          level?: string
          matric_no?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
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
      assign_supervisor: {
        Args: { _email: string; _placement: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_inst_staff: { Args: { _inst: string }; Returns: boolean }
      my_institution: { Args: never; Returns: string }
      public_stats: { Args: never; Returns: Json }
      supervises: { Args: { _student: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "institution_admin"
        | "coordinator"
        | "student"
        | "industry_supervisor"
        | "institution_supervisor"
        | "org_admin"
      inst_status: "pending" | "approved" | "suspended"
      log_status: "submitted" | "approved" | "needs_correction"
      placement_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "institution_admin",
        "coordinator",
        "student",
        "industry_supervisor",
        "institution_supervisor",
        "org_admin",
      ],
      inst_status: ["pending", "approved", "suspended"],
      log_status: ["submitted", "approved", "needs_correction"],
      placement_status: ["pending", "approved", "rejected"],
    },
  },
} as const
