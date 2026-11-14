import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser } from "@/lib/admin/types";

// Persistence (localStorage) lives in the store's listener middleware, not in
// these reducers — reducers must stay pure.

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthState {
  token: string | null;
  user: AdminUser | null;
  status: AuthStatus; // "loading" until the saved session has been checked
}

export interface Credentials {
  token: string;
  user: AdminUser;
}

const initialState: AuthState = { token: null, user: null, status: "loading" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Result of reading the saved session on startup (null = none / expired). */
    sessionRestored(state, action: PayloadAction<Credentials | null>) {
      state.token = action.payload?.token ?? null;
      state.user = action.payload?.user ?? null;
      state.status = action.payload ? "authenticated" : "anonymous";
    },
    credentialsReceived(state, action: PayloadAction<Credentials>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = "authenticated";
    },
    userRefreshed(state, action: PayloadAction<AdminUser>) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.token = null;
      state.user = null;
      state.status = "anonymous";
    },
  },
});

export const { sessionRestored, credentialsReceived, userRefreshed, loggedOut } = authSlice.actions;
export default authSlice.reducer;
