export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          total_points: number
          rank: string
          achievements: string[]
          university: string | null
          major: string | null
          year: string | null
          location: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          total_points?: number
          rank?: string
          achievements?: string[]
          university?: string | null
          major?: string | null
          year?: string | null
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          total_points?: number
          rank?: string
          achievements?: string[]
          university?: string | null
          major?: string | null
          year?: string | null
          location?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          code: string
          description: string
          tags: string[]
          admin_id: string
          max_members: number
          is_private: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string
          description: string
          tags?: string[]
          admin_id: string
          max_members?: number
          is_private?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          tags?: string[]
          admin_id?: string
          max_members?: number
          is_private?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
          last_seen: string
          is_online: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
          last_seen?: string
          is_online?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          joined_at?: string
          last_seen?: string
          is_online?: boolean
        }
      }
      tasks: {
        Row: {
          id: string
          room_id: string
          title: string
          description: string
          duration: number
          assignee_id: string
          status: 'pending' | 'in-progress' | 'completed'
          order_index: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          title: string
          description?: string
          duration?: number
          assignee_id: string
          status?: 'pending' | 'in-progress' | 'completed'
          order_index?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          title?: string
          description?: string
          duration?: number
          assignee_id?: string
          status?: 'pending' | 'in-progress' | 'completed'
          order_index?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          message: string
          message_type: 'message' | 'system'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          message: string
          message_type?: 'message' | 'system'
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          message?: string
          message_type?: 'message' | 'system'
          created_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          room_id: string
          user_id: string
          start_time: string
          end_time: string | null
          focus_time: number
          completed_tasks: number
          is_active: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          start_time?: string
          end_time?: string | null
          focus_time?: number
          completed_tasks?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          focus_time?: number
          completed_tasks?: number
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}