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
      catalog_brands: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      catalog_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "catalog_brands"
            referencedColumns: ["id"]
          }
        ]
      }
      equipment_records: {
        Row: {
          accessories: string | null
          additional_observations: string | null
          approval_at: string | null
          assigned_technician_ids: number[] | null
          brand: string
          client_name: string
          client_report: string | null
          condition_in: string | null
          created_by: string | null
          current_status_id: number
          date_in: string
          end_diagnosis_at: string | null
          end_maintenance_at: string | null
          finalized_at: string | null
          fr_number: string
          id: string
          is_priority: boolean
          model: string
          pending_approval_at: string | null
          report_number: string | null
          serial_number: string
          service_type: Database["public"]["Enums"]["service_type_enum"]
          start_diagnosis_at: string | null
          start_maintenance_at: string | null
          updated_at: string
        }
        Insert: {
          accessories?: string | null
          additional_observations?: string | null
          approval_at?: string | null
          assigned_technician_ids?: number[] | null
          brand: string
          client_name: string
          client_report?: string | null
          condition_in?: string | null
          created_by?: string | null
          current_status_id: number
          date_in?: string
          end_diagnosis_at?: string | null
          end_maintenance_at?: string | null
          finalized_at?: string | null
          fr_number: string
          id?: string
          is_priority?: boolean
          model: string
          pending_approval_at?: string | null
          report_number?: string | null
          serial_number: string
          service_type: Database["public"]["Enums"]["service_type_enum"]
          start_diagnosis_at?: string | null
          start_maintenance_at?: string | null
          updated_at?: string
        }
        Update: {
          accessories?: string | null
          additional_observations?: string | null
          approval_at?: string | null
          assigned_technician_ids?: number[] | null
          brand?: string
          client_name?: string
          client_report?: string | null
          condition_in?: string | null
          created_by?: string | null
          current_status_id?: number
          date_in?: string
          end_diagnosis_at?: string | null
          end_maintenance_at?: string | null
          finalized_at?: string | null
          fr_number?: string
          id?: string
          is_priority?: boolean
          model?: string
          pending_approval_at?: string | null
          report_number?: string | null
          serial_number?: string
          service_type?: Database["public"]["Enums"]["service_type_enum"]
          start_diagnosis_at?: string | null
          start_maintenance_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_records_current_status_id_fkey"
            columns: ["current_status_id"]
            isOneToOne: false
            referencedRelation: "workflow_states"
            referencedColumns: ["id"]
          }
        ]
      }
      part_compatibilities: {
        Row: {
          created_at: string
          id: string
          model_id: string
          part_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          part_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          part_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_compatibilities_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "catalog_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_compatibilities_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          }
        ]
      }
      parts_catalog: {
        Row: {
          created_at: string
          id: string
          name: string
          part_number: string
          specifications: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          part_number: string
          specifications?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          part_number?: string
          specifications?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      status_history: {
        Row: {
          changed_by_id: string | null
          changed_by_username: string
          equipment_id: string
          id: number
          is_override: boolean
          new_status: string
          override_reason: string | null
          previous_status: string | null
          timestamp: string
        }
        Insert: {
          changed_by_id?: string | null
          changed_by_username: string
          equipment_id: string
          id?: number
          is_override?: boolean
          new_status: string
          override_reason?: string | null
          previous_status?: string | null
          timestamp?: string
        }
        Update: {
          changed_by_id?: string | null
          changed_by_username?: string
          equipment_id?: string
          id?: number
          is_override?: boolean
          new_status?: string
          override_reason?: string | null
          previous_status?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_with_status"
            referencedColumns: ["id"]
          }
        ]
      }
      technicians: {
        Row: {
          id: number
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_superadmin: boolean
          role: Database["public"]["Enums"]["user_role_enum"]
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          is_superadmin?: boolean
          role?: Database["public"]["Enums"]["user_role_enum"]
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_superadmin?: boolean
          role?: Database["public"]["Enums"]["user_role_enum"]
          username?: string
        }
        Relationships: []
      }
      workflow_states: {
        Row: {
          color: string
          created_at: string
          id: number
          is_initial: boolean
          is_terminal: boolean
          name: string
          order_index: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: number
          is_initial?: boolean
          is_terminal?: boolean
          name: string
          order_index: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: number
          is_initial?: boolean
          is_terminal?: boolean
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      workflow_transitions: {
        Row: {
          allowed_roles: string[]
          created_at: string
          from_state_id: number
          id: number
          to_state_id: number
        }
        Insert: {
          allowed_roles: string[]
          created_at?: string
          from_state_id: number
          id?: number
          to_state_id: number
        }
        Update: {
          allowed_roles?: string[]
          created_at?: string
          from_state_id?: number
          id?: number
          to_state_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_from_state_id_fkey"
            columns: ["from_state_id"]
            isOneToOne: false
            referencedRelation: "workflow_states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_to_state_id_fkey"
            columns: ["to_state_id"]
            isOneToOne: false
            referencedRelation: "workflow_states"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      equipment_with_status: {
        Row: {
          accessories: string | null
          additional_observations: string | null
          approval_at: string | null
          assigned_technician_ids: number[] | null
          assigned_technicians: string[] | null
          brand: string
          client_name: string
          client_report: string | null
          condition_in: string | null
          created_by: string | null
          current_status_id: number | null
          date_in: string | null
          days_elapsed: number | null
          end_diagnosis_at: string | null
          end_maintenance_at: string | null
          finalized_at: string | null
          fr_number: string | null
          id: string | null
          is_priority: boolean | null
          is_terminal: boolean | null
          model: string | null
          pending_approval_at: string | null
          phase_1_days: number | null
          phase_2_days: number | null
          phase_3_days: number | null
          report_number: string | null
          serial_number: string | null
          service_type: Database["public"]["Enums"]["service_type_enum"] | null
          start_diagnosis_at: string | null
          start_maintenance_at: string | null
          status_color: string | null
          status_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_records_current_status_id_fkey"
            columns: ["current_status_id"]
            isOneToOne: false
            referencedRelation: "workflow_states"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      service_type_enum: "GARANTIA_CABELAB" | "GARANTIA_ESAB" | "REVISION_GENERAL"
      user_role_enum:
        | "superadmin"
        | "admin"
        | "operaciones"
        | "recepcion"
        | "almacen"
        | "visualizador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
