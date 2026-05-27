export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:          string;
          email:       string;
          full_name:   string | null;
          avatar_url:  string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      projects: {
        Row: {
          id:          string;
          name:        string;
          type:        "electrico" | "civil" | "mecanico";
          description: string | null;
          start_date:  string | null;
          end_date:    string | null;
          owner_id:    string;
          status:      "activo" | "pausado" | "completado" | "archivado";
          created_at:  string;
          updated_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      project_members: {
        Row: {
          id:         string;
          project_id: string;
          user_id:    string | null;
          email:      string;
          role:       "admin" | "editor" | "viewer";
          status:     "pendiente" | "activo" | "rechazado";
          invited_by: string;
          invited_at: string;
          joined_at:  string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["project_members"]["Row"], "id" | "invited_at">;
        Update: Partial<Database["public"]["Tables"]["project_members"]["Insert"]>;
      };
      ifc_models: {
        Row: {
          id:          string;
          project_id:  string;
          filename:    string;
          r2_key:      string;
          r2_url:      string;
          size_bytes:  number | null;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ifc_models"]["Row"], "id" | "uploaded_at">;
        Update: Partial<Database["public"]["Tables"]["ifc_models"]["Insert"]>;
      };
      model_elements: {
        Row: {
          id:         string;
          model_id:   string;
          express_id: number;
          global_id:  string | null;
          name:       string | null;
          type:       string | null;
          properties: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["model_elements"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["model_elements"]["Insert"]>;
      };
      element_technical_info: {
        Row: {
          id:          string;
          element_id:  string;
          field_name:  string;
          field_value: string | null;
          updated_by:  string;
          updated_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["element_technical_info"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["element_technical_info"]["Insert"]>;
      };
      element_progress: {
        Row: {
          id:           string;
          element_id:   string;
          progress_pct: number;
          status:       "planificado" | "en_ejecucion" | "completado" | "con_observacion";
          notes:        string | null;
          updated_by:   string;
          updated_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["element_progress"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["element_progress"]["Insert"]>;
      };
      element_documents: {
        Row: {
          id:           string;
          element_id:   string | null;
          project_id:   string;
          filename:     string;
          storage_path: string;
          mime_type:    string | null;
          size_bytes:   number | null;
          uploaded_by:  string;
          uploaded_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["element_documents"]["Row"], "id" | "uploaded_at">;
        Update: Partial<Database["public"]["Tables"]["element_documents"]["Insert"]>;
      };
      maintenance_records: {
        Row: {
          id:                    string;
          element_id:            string;
          maintenance_date:      string;
          type:                  "preventivo" | "correctivo" | "predictivo";
          technician_name:       string | null;
          description:           string | null;
          result:                string | null;
          next_maintenance_date: string | null;
          alert_days_before:     number;
          alert_sent:            boolean;
          created_by:            string;
          created_at:            string;
        };
        Insert: Omit<Database["public"]["Tables"]["maintenance_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["maintenance_records"]["Insert"]>;
      };
    };
    Views:   Record<string, never>;
    Functions: Record<string, never>;
    Enums:   Record<string, never>;
  };
}

// Tipos derivados de conveniencia
export type Profile        = Database["public"]["Tables"]["profiles"]["Row"];
export type Project        = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember  = Database["public"]["Tables"]["project_members"]["Row"];
export type IFCModel       = Database["public"]["Tables"]["ifc_models"]["Row"];
export type ModelElement   = Database["public"]["Tables"]["model_elements"]["Row"];
export type ElementTechInfo= Database["public"]["Tables"]["element_technical_info"]["Row"];
export type ElementProgress= Database["public"]["Tables"]["element_progress"]["Row"];
export type ElementDocument= Database["public"]["Tables"]["element_documents"]["Row"];
export type MaintenanceRecord = Database["public"]["Tables"]["maintenance_records"]["Row"];

export type ProjectWithMeta = Project & {
  member_count?: number;
  model_count?:  number;
  my_role?:      ProjectMember["role"];
};

export type ProjectMemberWithProfile = ProjectMember & {
  profile?: Pick<Profile, "full_name" | "avatar_url" | "email">;
};
