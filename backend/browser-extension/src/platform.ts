export interface ExtensionAPI {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(value: Record<string, unknown>): Promise<void>;
      remove(key: string | string[]): Promise<void>;
    };
    onChanged: {
      addListener(
        callback: (changes: Record<string, { newValue?: unknown }>, area: string) => void,
      ): void;
    };
  };
  runtime: {
    getURL(path: string): string;
    onMessage?: {
      addListener(
        callback: (message: unknown, sender: unknown, respond: (value: unknown) => void) => void,
      ): void;
    };
  };
  tabs?: {
    query(query: { active?: boolean; currentWindow?: boolean }): Promise<{ id?: number }[]>;
    sendMessage(id: number, message: unknown): Promise<unknown>;
  };
  permissions?: { onRemoved?: { addListener(callback: () => void): void } };
}
declare global {
  var chrome: ExtensionAPI | undefined;
  var browser: ExtensionAPI | undefined;
}
export const api: ExtensionAPI | undefined = globalThis.browser ?? globalThis.chrome;
