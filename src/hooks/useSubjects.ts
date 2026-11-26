import { useState, useCallback } from "react";
import type { Subject } from "../types";
import {
  getAllSubjects,
  putSubject,
  deleteSubject as dbDeleteSubject,
  putQuestions,
  deleteQuestionsForSubject,
  getAllProgress,
  putAllProgress,
} from "../db/operations";
import { parseTprepFile, readFileAsText, validateTprepFile } from "../utils/tprepParser";

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllSubjects();
      setSubjects(all);
    } catch (e) {
      setError("教科データの読み込みに失敗しました。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const importTprepFile = useCallback(async (file: File): Promise<string> => {
    setError(null);
    try {
      validateTprepFile(file);
      const text = await readFileAsText(file);
      const { subject, questions } = parseTprepFile(text);

      // 既存の progress を保持しながら上書き
      const existingProgress = await getAllProgress();

      // 旧問題を削除
      await deleteQuestionsForSubject(subject.subjectId);

      // 教科と問題を保存
      await putSubject(subject);
      await putQuestions(questions);

      // 一致する progress を保持（新しいquestionIdのみ残す）
      const newQuestionIds = new Set(questions.map((q) => q.questionId));
      const preservedProgress = existingProgress.filter((p) =>
        newQuestionIds.has(p.questionId)
      );
      if (preservedProgress.length > 0) {
        await putAllProgress(preservedProgress);
      }

      await loadSubjects();
      return subject.subjectName;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "ファイルの読み込みに失敗しました。";
      setError(msg);
      throw e;
    }
  }, [loadSubjects]);

  const importTprepFromUrl = useCallback(async (url: string): Promise<string> => {
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`サンプルファイルの取得に失敗しました (${res.status})`);
      const text = await res.text();
      const { subject, questions } = parseTprepFile(text);

      await deleteQuestionsForSubject(subject.subjectId);
      await putSubject(subject);
      await putQuestions(questions);
      await loadSubjects();
      return subject.subjectName;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "サンプルの読み込みに失敗しました。";
      setError(msg);
      throw e;
    }
  }, [loadSubjects]);

  const deleteSubject = useCallback(async (subjectId: string): Promise<void> => {
    try {
      await dbDeleteSubject(subjectId);
      await loadSubjects();
    } catch (e) {
      setError("教科の削除に失敗しました。");
      throw e;
    }
  }, [loadSubjects]);

  const clearError = useCallback(() => setError(null), []);

  return {
    subjects,
    loading,
    error,
    loadSubjects,
    importTprepFile,
    importTprepFromUrl,
    deleteSubject,
    clearError,
  };
}
