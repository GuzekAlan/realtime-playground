import { create } from "zustand";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_KEY,
} from "@/lib/constants";
import { useRealtimeStore } from "./realtimeStore";

interface SupabaseStore {
  client: SupabaseClient | null;
  userId: string | null;
  email: string;

  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useSupabaseStore = create<SupabaseStore>((set, get) => ({
  client: null,
  userId: null,
  email: "",

  init() {
    set({
      client: createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY),
    });
  },

  async login(email, password) {
    const { client } = get();
    if (!client) return;

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(`Login failed: ${error.message}`);
      return;
    }

    if (data.session) {
      useRealtimeStore.getState().setAuth(data.session.access_token);
    }

    set({ userId: data.user.id, email });
    useRealtimeStore.getState().syncChannels();
  },

  async logout() {
    const { client } = get();
    if (!client) return;

    await client.auth.signOut();
    set({ userId: null, email: "" });
    useRealtimeStore.getState().setAuth(NEXT_PUBLIC_SUPABASE_KEY);
    useRealtimeStore.getState().syncChannels();
  },
}));
