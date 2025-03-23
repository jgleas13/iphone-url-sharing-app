export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string
          user_id: string
          key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          key?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      url_processing_logs: {
        Row: {
          id: string
          url_id: string
          type: string
          message: string
          data: string | null
          created_at: string
        }
        Insert: {
          id?: string
          url_id: string
          type: string
          message: string
          data?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          url_id?: string
          type?: string
          message?: string
          data?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_processing_logs_url_id_fkey"
            columns: ["url_id"]
            referencedRelation: "urls"
            referencedColumns: ["id"]
          }
        ]
      }
      urls: {
        Row: {
          id: string
          user_id: string
          url: string
          title: string | null
          summary: string | null
          tags: string[] | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          title?: string | null
          summary?: string | null
          tags?: string[] | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          title?: string | null
          summary?: string | null
          tags?: string[] | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "urls_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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