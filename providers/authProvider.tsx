import { PropsWithChildren, useEffect, useState } from "react";
import { AuthContext } from "../hooks/useAuthContext";
import { supabase } from "../lib/supabase";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch auth session once, and subscribe to auth state changes
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (error) console.error("Error fetching session:", error);

      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
