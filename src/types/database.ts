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
          phone_number: string | null
          email: string | null
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
          phone_number?: string | null
          email?: string | null
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
          phone_number?: string | null
          email?: string | null
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
      },
      task_user_status: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          user_name: string;
          status: 'Todo' | 'In Progress' | 'In Review' | 'Completed';
          updated_at: string;
        }
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          user_name: string;
          status: 'Todo' | 'In Progress' | 'In Review' | 'Completed';
          updated_at?: string;
        }
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          user_name?: string;
          status?: 'Todo' | 'In Progress' | 'In Review' | 'Completed';
          updated_at?: string;
        }
      },
      task_activity_log: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          user_name: string;
          action: string;
          timestamp: string;
        }
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          user_name: string;
          action: string;
          timestamp?: string;
        }
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          user_name?: string;
          action?: string;
          timestamp?: string;
        }
      },
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
      get_user_study_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_focus_minutes: number
          total_sessions: number
          completed_tasks: number
          active_sessions: number
          today_focus_minutes: number
          this_week_focus_minutes: number
          current_streak_days: number
        }
      }
      get_room_total_study_time: {
        Args: {
          room_uuid: string
        }
        Returns: number
      }
      get_room_details_for_join: {
        Args: {
          room_code: string
        }
        Returns: {
          id: string
          name: string
          description: string
          is_private: boolean
          is_active: boolean
          member_count: number
          max_members: number
          can_join: boolean
        }[]
      }
      join_room_with_code: {
        Args: {
          room_code: string
          user_uuid: string
        }
        Returns: {
          success: boolean
          room_id: string
          message: string
        }[]
      }
      can_join_room_with_code: {
        Args: {
          room_code: string
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}