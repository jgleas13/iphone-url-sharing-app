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
      urls: {
        Row: {
          id: string
          url: string
          page_title: string
          tags: string[]
          date_accessed: string
          user_id: string
          summary: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          page_title?: string
          tags?: string[]
          date_accessed?: string
          user_id: string
          summary?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          page_title?: string
          tags?: string[]
          date_accessed?: string
          user_id?: string
          summary?: string
          created_at?: string
          updated_at?: string
        }
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
  }
} 