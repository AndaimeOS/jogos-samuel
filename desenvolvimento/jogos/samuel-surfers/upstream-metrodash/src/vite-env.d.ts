/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  embedAnalytics?: {
    track(eventName: string, parameters?: Record<string, string | number | boolean>): boolean;
    startRun(gameName: string, getScore?: () => number | undefined): boolean;
    endRun(outcome: string, score?: number): boolean;
  };
}
