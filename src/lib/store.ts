import { LazyStore } from '@tauri-apps/plugin-store';

// Inisialisasi Tauti Store. File secure.bin akan disimpan di folder LocalAppData OS.
export const secureStore = new LazyStore('secure.bin');
