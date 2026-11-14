import { configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { api } from "./api";
import authReducer, { credentialsReceived, loggedOut, userRefreshed } from "./features/auth/authSlice";
import { authStorage } from "./features/auth/authStorage";

// Side effects of auth changes, kept out of the reducers.
const listener = createListenerMiddleware();

listener.startListening({
  matcher: isAnyOf(credentialsReceived, userRefreshed),
  effect: (_action, { getState }) => {
    const { token, user } = (getState() as RootState).auth;
    if (token && user) authStorage.save({ token, user });
  },
});

listener.startListening({
  actionCreator: loggedOut,
  effect: (_action, { dispatch }) => {
    authStorage.clear();
    // Drop every cached admin response so nothing leaks into the next session.
    dispatch(api.util.resetApiState());
  },
});

// A store per browser tab (created in ReduxProvider), as recommended for the
// Next.js App Router — never a module-level singleton shared across requests.
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(api.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
