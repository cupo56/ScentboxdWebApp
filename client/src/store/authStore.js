import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ user: session.user, session, profile, loading: false });
      } else {
        set({ user: null, session: null, profile: null, loading: false });
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({ user: session.user, session, profile });
        } else {
          set({ user: null, session: null, profile: null });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    set({
      user: data.user,
      session: data.session,
      profile,
      loading: false,
    });
    return true;
  },

  register: async (email, password, username) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      return false;
    }

    // Create profile with username
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
      });
    }

    set({ loading: false });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  clearError: () => set({ error: null }),

  setProfile: (profile) => set({ profile }),
}));

export default useAuthStore;
