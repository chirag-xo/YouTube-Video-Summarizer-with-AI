import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      video_summaries: {
        Row: {
          id: string
          user_id: string
          youtube_url: string
          title: string
          description: string
          transcript: string
          summary: string
          key_points: string[]
          video_duration: number
          summary_video_url: string | null
          status: 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          youtube_url: string
          title: string
          description?: string
          transcript: string
          summary: string
          key_points: string[]
          video_duration: number
          summary_video_url?: string | null
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          youtube_url?: string
          title?: string
          description?: string
          transcript?: string
          summary?: string
          key_points?: string[]
          video_duration?: number
          summary_video_url?: string | null
          status?: 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}