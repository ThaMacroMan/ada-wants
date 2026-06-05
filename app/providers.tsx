"use client";

import { MeshProvider } from "@meshsdk/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <MeshProvider>{children}</MeshProvider>;
}
