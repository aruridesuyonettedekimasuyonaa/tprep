import { useState, useCallback } from "react";
import type { Question, QuestionProgress } from "../types";
import {
  getQuestionsBySubject,
  getProgressForSubject,
  recordAnswer as dbRecordAnswer,
  toggleUnsure as dbToggleUnsure,
} from "../db/operations";

export function useProgress(subjectId: string | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, QuestionProgress>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [qs, pm] = await Promise.all([
        getQuestionsBySubject(subjectId),
        getProgressForSubject(subjectId),
      ]);
      setQuestions(qs.sort((a, b) => a.sortOrder - b.sortOrder));
      setProgressMap(pm);
    } catch (e) {
      setError("データの読み込みに失敗しました。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  const recordAnswer = useCallback(
    async (questionId: string, isCorrect: boolean) => {
      try {
        await dbRecordAnswer(questionId, isCorrect);
        setProgressMap((prev) => {
          const existing = prev.get(questionId);
          const updated: QuestionProgress = {
            questionId,
            secondLastCorrect: existing?.lastCorrect ?? null,
            lastCorrect: isCorrect,
            isUnsure: existing?.isUnsure ?? false,
            attemptCount: (existing?.attemptCount ?? 0) + 1,
            correctCount: (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0),
            updatedAt: new Date().toISOString(),
          };
          return new Map(prev).set(questionId, updated);
        });
      } catch (e) {
        console.error("回答の保存に失敗しました:", e);
        throw new Error("回答の保存に失敗しました。ディスク容量をご確認ください。");
      }
    },
    []
  );

  const toggleUnsure = useCallback(async (questionId: string): Promise<boolean> => {
    try {
      const newVal = await dbToggleUnsure(questionId);
      setProgressMap((prev) => {
        const existing = prev.get(questionId) ?? {
          questionId,
          lastCorrect: null,
          secondLastCorrect: null,
          isUnsure: false,
          attemptCount: 0,
          correctCount: 0,
          updatedAt: null,
        };
        return new Map(prev).set(questionId, { ...existing, isUnsure: newVal });
      });
      return newVal;
    } catch (e) {
      console.error("迷ったフラグの保存に失敗しました:", e);
      throw new Error("データの保存に失敗しました。");
    }
  }, []);

  // 間違えた問題（直近2回のうちどちらかが false）
  const wrongQuestions = questions.filter((q) => {
    const p = progressMap.get(q.questionId);
    if (!p) return false;
    return p.lastCorrect === false || p.secondLastCorrect === false;
  });

  // 迷った問題
  const unsureQuestions = questions.filter((q) => {
    const p = progressMap.get(q.questionId);
    return p?.isUnsure === true;
  });

  return {
    questions,
    progressMap,
    wrongQuestions,
    unsureQuestions,
    loading,
    error,
    loadData,
    recordAnswer,
    toggleUnsure,
  };
}
