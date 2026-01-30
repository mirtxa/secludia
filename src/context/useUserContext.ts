import { useContext } from "react";
import { UserContext, type UserContextValue } from "./UserContext.types";

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUserContext must be used inside UserContextProvider");
  return ctx;
}
