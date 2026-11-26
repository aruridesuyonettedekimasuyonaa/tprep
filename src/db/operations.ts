import { getDB } from "./schema";
import type { Subject, Question, QuestionProgress } from "../types";

// ============================================================
// Subjects
// ============================================================

export async function getAllSubjects(): Promise<Subject[]> {
  const db = await getDB();
  return db.getAll("subjects");
}

export async function putSubject(subject: Subject): Promise<void> {
  const db = await getDB();
  await db.put("subjects", subject);
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["subjects", "questions", "progress"], "readwrite");

  // Delete the subject
  await tx.objectStore("subjects").delete(subjectId);

  // Delete all questions for this subject
  const questionStore = tx.objectStore("questions");
  const index = questionStore.index("by-subjectId");
  const keys = await index.getAllKeys(subjectId);
  for (const key of keys) {
    await questionStore.delete(key);
    await tx.objectStore("progress").delete(key);
  }

  await tx.done;
}

// ============================================================
// Questions
// ============================================================

export async function getQuestionsBySubject(subjectId: string): Promise<Question[]> {
  const db = await getDB();
  const index = db.transaction("questions").store.index("by-subjectId");
  return index.getAll(subjectId);
}

export async function getAllQuestions(): Promise<Question[]> {
  const db = await getDB();
  return db.getAll("questions");
}

export async function putQuestion(question: Question): Promise<void> {
  const db = await getDB();
  await db.put("questions", question);
}

export async function putQuestions(questions: Question[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("questions", "readwrite");
  await Promise.all([
    ...questions.map((q) => tx.store.put(q)),
    tx.done,
  ]);
}

export async function deleteQuestionsForSubject(subjectId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("questions", "readwrite");
  const index = tx.store.index("by-subjectId");
  const keys = await index.getAllKeys(subjectId);
  await Promise.all(keys.map((k) => tx.store.delete(k)));
  await tx.done;
}

// ============================================================
// Progress
// ============================================================

export async function getProgress(questionId: string): Promise<QuestionProgress | undefined> {
  const db = await getDB();
  return db.get("progress", questionId);
}

export async function getAllProgress(): Promise<QuestionProgress[]> {
  const db = await getDB();
  return db.getAll("progress");
}

export async function getProgressForSubject(
  subjectId: string
): Promise<Map<string, QuestionProgress>> {
  const db = await getDB();
  const questions = await db
    .transaction("questions")
    .store.index("by-subjectId")
    .getAll(subjectId);
  const qids = questions.map((q) => q.questionId);

  const progressMap = new Map<string, QuestionProgress>();
  const tx = db.transaction("progress");
  for (const qid of qids) {
    const p = await tx.store.get(qid);
    if (p) progressMap.set(qid, p);
  }
  return progressMap;
}

export function createDefaultProgress(questionId: string): QuestionProgress {
  return {
    questionId,
    lastCorrect: null,
    secondLastCorrect: null,
    isUnsure: false,
    attemptCount: 0,
    correctCount: 0,
    updatedAt: null,
  };
}

export async function recordAnswer(
  questionId: string,
  isCorrect: boolean
): Promise<void> {
  const db = await getDB();
  const existing =
    (await db.get("progress", questionId)) ?? createDefaultProgress(questionId);

  const updated: QuestionProgress = {
    ...existing,
    secondLastCorrect: existing.lastCorrect,
    lastCorrect: isCorrect,
    attemptCount: existing.attemptCount + 1,
    correctCount: existing.correctCount + (isCorrect ? 1 : 0),
    updatedAt: new Date().toISOString(),
  };

  await db.put("progress", updated);
}

export async function toggleUnsure(questionId: string): Promise<boolean> {
  const db = await getDB();
  const existing =
    (await db.get("progress", questionId)) ?? createDefaultProgress(questionId);

  const updated: QuestionProgress = {
    ...existing,
    isUnsure: !existing.isUnsure,
  };

  await db.put("progress", updated);
  return updated.isUnsure;
}

export async function putProgress(progress: QuestionProgress): Promise<void> {
  const db = await getDB();
  await db.put("progress", progress);
}

export async function putAllProgress(progressList: QuestionProgress[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("progress", "readwrite");
  await Promise.all([
    ...progressList.map((p) => tx.store.put(p)),
    tx.done,
  ]);
}
