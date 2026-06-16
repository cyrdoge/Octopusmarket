export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      wallets: {
        Row: {
          address: string;
          role: "user" | "admin";
          status: "active" | "suspended";
          username: string | null;
          display_name: string | null;
          twitter_handle: string | null;
          avatar_src: string | null;
          registered_at: string | null;
          first_connected_at: string;
          last_connected_at: string;
          connection_count: number;
          latest_activity_at: string;
          latest_activity_label: string;
          payment_count: number;
          approved_payment_count: number;
          pending_payment_count: number;
          rejected_payment_count: number;
          total_paid_usdc: number;
          total_won_usdc: number;
          total_lost_usdc: number;
          total_claimed_usdc: number;
        };
        Insert: Partial<Database["public"]["Tables"]["wallets"]["Row"]> & {
          address: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallets"]["Row"]>;
        Relationships: [];
      };
      prediction_markets: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          market_type: string;
          visual_type: string | null;
          resolution_label: string;
          event_date_label: string | null;
          left_competitor_name: string | null;
          left_competitor_image: string | null;
          right_competitor_name: string | null;
          right_competitor_image: string | null;
          single_name: string | null;
          single_image: string | null;
          options: Json;
          created_by_wallet: string;
          created_at: string;
          is_admin_created: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["prediction_markets"]["Row"]> & {
          id: string;
          category_id: string;
          title: string;
          created_by_wallet: string;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_markets"]["Row"]>;
        Relationships: [];
      };
      prediction_resolutions: {
        Row: {
          market_id: string;
          outcome_id: string;
          resolved_at: string;
          resolved_by_wallet: string;
        };
        Insert: {
          market_id: string;
          outcome_id: string;
          resolved_by_wallet: string;
          resolved_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_resolutions"]["Row"]>;
        Relationships: [];
      };
      prediction_bets: {
        Row: {
          id: string;
          market_id: string;
          market_title: string;
          category_label: string;
          selection_id: string;
          selection_label: string;
          amount: number;
          reserve_fee: number;
          total_charged: number;
          claim_fee_rate: number;
          payout_multiple: number;
          gross_reward: number;
          net_reward: number;
          wallet_address: string;
          payment_reference: string;
          payment_request_id: string;
          created_at: string;
          reported_at: string;
          admin_decision_status: "pending" | "approved" | "rejected" | null;
          resolution_outcome_id: string | null;
          resolved_at: string | null;
          resolved_by_wallet: string | null;
          result_status: string | null;
          winning_choice_label: string | null;
          payout_recorded_at: string | null;
          claimed_at: string | null;
          claim_reference: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["prediction_bets"]["Row"]> & {
          id: string;
          market_id: string;
          market_title: string;
          selection_id: string;
          selection_label: string;
          amount: number;
          wallet_address: string;
          payment_reference: string;
          payment_request_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["prediction_bets"]["Row"]>;
        Relationships: [];
      };
      admin_notifications: {
        Row: {
          id: string;
          payment_request_id: string;
          payment_reference: string;
          flow: "prediction" | "launch" | "listing";
          title: string;
          subtitle: string | null;
          category_label: string | null;
          market_id: string | null;
          selection_id: string | null;
          selection_label: string | null;
          username: string | null;
          user_wallet: string;
          recipient_wallet: string;
          amount_usdc: number;
          reserve_fee_usdc: number;
          total_paid_usdc: number;
          created_at: string;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          reviewed_by_wallet: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_notifications"]["Row"]> & {
          id: string;
          payment_request_id: string;
          payment_reference: string;
          flow: "prediction" | "launch" | "listing";
          title: string;
          user_wallet: string;
          recipient_wallet: string;
          amount_usdc: number;
        };
        Update: Partial<Database["public"]["Tables"]["admin_notifications"]["Row"]>;
        Relationships: [];
      };
      ai_listings: {
        Row: {
          id: string;
          wallet_address: string;
          display_name: string;
          twitter_handle: string;
          icon_src: string;
          icon_name: string;
          website_url: string;
          description: string;
          social_url: string;
          guide_file_name: string;
          guide_file_url: string;
          plan_id: "free" | "starter" | "builder";
          billing_label: string;
          amount_usd: number;
          auto_renew_enabled: boolean;
          submitted_at: string;
          updated_at: string;
          status: "pending" | "approved" | "rejected";
          badge: "none" | "blue" | "gold";
          admin_notes: string | null;
          payment_reference: string | null;
          payment_request_id: string | null;
          visible_in_explore: boolean;
          visitor_count: number;
          unique_visitor_keys: string[];
        };
        Insert: Partial<Database["public"]["Tables"]["ai_listings"]["Row"]> & {
          id: string;
          wallet_address: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_listings"]["Row"]>;
        Relationships: [];
      };
      tool_ratings: {
        Row: {
          tool_name: string;
          actor_key: string;
          rating: number;
          created_at: string;
        };
        Insert: {
          tool_name: string;
          actor_key: string;
          rating: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tool_ratings"]["Row"]>;
        Relationships: [];
      };
      tool_reactions: {
        Row: {
          tool_name: string;
          actor_key: string;
          reaction: "heart" | "thumbs-up" | "flame";
          created_at: string;
        };
        Insert: {
          tool_name: string;
          actor_key: string;
          reaction: "heart" | "thumbs-up" | "flame";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tool_reactions"]["Row"]>;
        Relationships: [];
      };
      tool_comments: {
        Row: {
          id: string;
          tool_name: string;
          author: string;
          content: string;
          created_at: string;
        };
        Insert: {
          tool_name: string;
          author: string;
          content: string;
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tool_comments"]["Row"]>;
        Relationships: [];
      };
      tool_reports: {
        Row: {
          id: string;
          tool_name: string;
          created_at: string;
        };
        Insert: {
          tool_name: string;
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tool_reports"]["Row"]>;
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_wallet: string;
          action: string;
          target_id: string;
          details: string;
          created_at: string;
        };
        Insert: {
          id: string;
          admin_wallet: string;
          action: string;
          target_id: string;
          details?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_logs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
