import { useContext } from "react";
import { CryptoContext, type CryptoContextValue } from "./CryptoContext.types";

export function useCryptoContext(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) {
    throw new Error("useCryptoContext must be used inside CryptoProvider");
  }
  return ctx;
}
