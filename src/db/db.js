import Dexie from "dexie";

export const db = new Dexie("SafeDriveDB");

// Database schema
db.version(1).stores({
  logs: "++id, timestamp, ear, level",
});
