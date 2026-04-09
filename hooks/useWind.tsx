"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { Vector3 } from "three";

interface WindContextType {
  strength: number;      // 0.2 → 1.0 (calm to gust)
  direction: Vector3;    // normalized direction vector
  gusts: number;         // oscillates 0→1, for animation variety
}

const WindContext = createContext<WindContextType | undefined>(undefined);

// Wind simulation state (shared across components)
let windTime = 0;

export function WindProvider({ children }: { children: ReactNode }) {
  const [wind, setWind] = useState<WindContextType>({
    strength: 0.5,
    direction: new Vector3(1, 0, 0),
    gusts: 0,
  });

  // Called by useFrame in MeadowScene
  const updateWind = useCallback((deltaTime: number) => {
    windTime += deltaTime;

    // Multi-frequency wind for organic feel
    const gust1 = Math.sin(windTime * 0.3) * 0.6;
    const gust2 = Math.sin(windTime * 0.15 + 1.2) * 0.4;
    const gust3 = Math.sin(windTime * 0.07 + 2.4) * 0.3;

    const strength = Math.max(0.2, gust1 + gust2 + gust3);
    const angle = Math.sin(windTime * 0.5) * Math.PI * 0.4;

    setWind({
      strength,
      direction: new Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize(),
      gusts: Math.abs(Math.sin(windTime * 0.7)),
    });
  }, []);

  return (
    <WindContext.Provider value={wind}>
      {/* Pass updateWind to child that needs it (MeadowScene) */}
      {typeof children === "function" ? children(updateWind) : children}
    </WindContext.Provider>
  );
}

export function useWind() {
  const context = useContext(WindContext);
  if (!context) {
    throw new Error("useWind must be used within <WindProvider>");
  }
  return context;
}

// Expose updater for MeadowScene
export { useCallback };
