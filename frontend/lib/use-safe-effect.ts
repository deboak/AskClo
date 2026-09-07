"use client";

import { useEffect as useReactEffect, type DependencyList } from "react";

type EffectResult = void | (() => void) | Promise<unknown> | unknown;

/** Ensures React only receives a cleanup function, never a Promise or DOM return value. */
export function useSafeEffect(effect: () => EffectResult, dependencies?: DependencyList) {
  useReactEffect(() => {
    const result = effect();
    return typeof result === "function" ? result as () => void : undefined;
  }, dependencies);
}
