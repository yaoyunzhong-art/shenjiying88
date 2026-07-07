/**
 * In-memory mock for @react-native-async-storage/async-storage.
 * Avoids 'window is not defined' errors in vitest Node.js environment.
 */
const store = {};

const AsyncStorage = {
  getItem: async (key) => store[key] ?? null,
  setItem: async (key, value) => {
    store[key] = String(value);
  },
  removeItem: async (key) => {
    delete store[key];
  },
  clear: async () => {
    Object.keys(store).forEach(key => delete store[key]);
  },
  getAllKeys: async () => Object.keys(store),
  multiGet: async (keys) => keys.map(key => [key, store[key] ?? null]),
  multiSet: async (kvPairs) => {
    kvPairs.forEach(([key, value]) => { store[key] = value; });
  },
  multiRemove: async (keys) => {
    keys.forEach(key => delete store[key]);
  },
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
