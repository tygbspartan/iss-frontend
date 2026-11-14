"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { makeStore } from "./store";
import { sessionRestored } from "./features/auth/authSlice";
import { authStorage } from "./features/auth/authStorage";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // Lazily created once per mount, so each browser tab gets its own store.
  const [store] = useState(makeStore);

  useEffect(() => {
    // localStorage only exists in the browser, so the session is restored after mount.
    store.dispatch(sessionRestored(authStorage.load()));
    // Refetch on window focus / reconnect for queries that opt in.
    return setupListeners(store.dispatch);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
