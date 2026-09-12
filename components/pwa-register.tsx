"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("LifeRPG PWA Service Worker active: ", registration.scope);
          })
          .catch((error) => {
            console.error("LifeRPG PWA Service Worker registration failed: ", error);
          });
      });
    }
  }, []);

  return null;
}
