export type GameEventMap = {
  action: { type: InputAction };
  collect: { kind: "coin" | "magnet" | "shield" | "multiplier" | "sneakers" | "board" };
  crash: { protected: boolean };
  mission: { id: string };
};

export type InputAction = "left" | "right" | "jump" | "roll" | "board" | "pause";

export class EventBus {
  private listeners = new Map<keyof GameEventMap, Set<(payload: never) => void>>();

  on<K extends keyof GameEventMap>(event: K, handler: (payload: GameEventMap[K]) => void): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(handler as (payload: never) => void);
    this.listeners.set(event, set);
    return () => set.delete(handler as (payload: never) => void);
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload as never));
  }
}
