import { openDB, type IDBPDatabase } from "idb";
import type { Subject, Question, QuestionProgress } from "../types";

export const DB_NAME = "tprep-db";
export const DB_VERSION = 1;

export type TprepDB = IDBPDatabase<{
  subjects: {
    key: string;
    value: Subject;
  };
  questions: {
    key: string;
    value: Question;
    indexes: { "by-subjectId": string };
  };
  progress: {
    key: string;
    value: QuestionProgress;
  };
}>;

let dbPromise: Promise<TprepDB> | null = null;

export function getDB(): Promise<TprepDB> {
  if (!dbPromise) {
    dbPromise = openDB<{
      subjects: { key: string; value: Subject };
      questions: {
        key: string;
        value: Question;
        indexes: { "by-subjectId": string };
      };
      progress: { key: string; value: QuestionProgress };
    }>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // subjects ストア
        if (!db.objectStoreNames.contains("subjects")) {
          db.createObjectStore("subjects", { keyPath: "subjectId" });
        }
        // questions ストア
        if (!db.objectStoreNames.contains("questions")) {
          const questionStore = db.createObjectStore("questions", {
            keyPath: "questionId",
          });
          questionStore.createIndex("by-subjectId", "subjectId");
        }
        // progress ストア
        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "questionId" });
        }
      },
    }) as Promise<TprepDB>;
  }
  return dbPromise;
}

export function resetDBConnection(): void {
  dbPromise = null;
}
