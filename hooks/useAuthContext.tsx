import type { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export type AuthData = {
  user?: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
};

export const AuthContext = createContext<AuthData>({
  user: undefined,
  isLoading: true,
  isLoggedIn: false,
});

export const useAuthContext = () => useContext(AuthContext);
