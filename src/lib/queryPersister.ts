import { get, set, del } from "idb-keyval";
import {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

/**
 * Membuat custom persister untuk React Query menggunakan idb-keyval.
 * Ini memastikan cache disimpan secara offine di IndexedDB browser desktop (Webview Tauri),
 * yang jauh lebih cepat daripada localStorage dan tidak memiliki batas ukuran 5MB.
 */
export function createIDBPersister(idbValidKey: IDBValidKey = "imarah-react-query-cache") {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(idbValidKey, client);
      } catch (error) {
        console.error("Gagal menyimpan cache ke IndexedDB", error);
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(idbValidKey);
      } catch (error) {
        console.error("Gagal membaca cache dari IndexedDB", error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(idbValidKey);
      } catch (error) {
        console.error("Gagal menghapus cache dari IndexedDB", error);
      }
    },
  } as Persister;
}

export const queryPersister = createIDBPersister();
