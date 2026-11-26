import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProgress } from "../../hooks/useProgress";
import { getAllSubjects } from "../../db/operations";
import { Button } from "../common/Button";
import { ErrorMessage } from "../common/ErrorMessage";
import { LoadingSpinner } from "../common/LoadingSpinner";
import type { Subject, ExerciseMode } from "../../types";
import { useSession } from "../../store/sessionStore";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ModeSelectScreen: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { initSession } = useSession();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [subjectLoading, setSubjectLoading] = useState(true);

  const {
    questions,
    progressMap,
    wrongQuestions,
    unsureQuestions,
    loading,
    error,
    loadData,
  } = useProgress(subjectId ?? null);

  useEffect(() => {
    const load = async () => {
      if (!subjectId) return;
      const all = await getAllSubjects();
      const found = all.find((s) => s.subjectId === subjectId);
      setSubject(found ?? null);
      setSubjectLoading(false);
    };
    load();
  }, [subjectId]);

  useEffect(() => {
    if (subjectId) loadData();
  }, [subjectId, loadData]);

  if (!subjectId) return null;

  // Distinct report numbers
  const reportNos = [...new Set(questions.map((q) => q.reportNo))].sort(
    (a, b) => a - b
  );

  const toggleReport = (no: number) => {
    setSelectedReports((prev) =>
      prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no]
    );
  };

  const startReportMode = () => {
    if (selectedReports.length === 0) return;
    const filtered = questions
      .filter((q) => selectedReports.includes(q.reportNo))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const mode: ExerciseMode = {
      type: "report",
      subjectId,
      reportNos: selectedReports,
    };
    const initialUnsure = new Set(
      filtered
        .filter((q) => progressMap.get(q.questionId)?.isUnsure)
        .map((q) => q.questionId)
    );
    initSession(mode, filtered, initialUnsure);
    navigate("/exercise");
  };

  const startWrongMode = () => {
    if (wrongQuestions.length === 0) return;
    const shuffled = shuffle(wrongQuestions);
    const mode: ExerciseMode = { type: "wrong", subjectId };
    const initialUnsure = new Set(
      shuffled
        .filter((q) => progressMap.get(q.questionId)?.isUnsure)
        .map((q) => q.questionId)
    );
    initSession(mode, shuffled, initialUnsure);
    navigate("/exercise");
  };

  const startUnsureMode = () => {
    if (unsureQuestions.length === 0) return;
    const shuffled = shuffle(unsureQuestions);
    const mode: ExerciseMode = { type: "unsure", subjectId };
    const initialUnsure = new Set(shuffled.map((q) => q.questionId));
    initSession(mode, shuffled, initialUnsure);
    navigate("/exercise");
  };

  if (subjectLoading || loading) return <LoadingSpinner message="読み込み中..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="ホームへ戻る"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-xs text-slate-400 font-medium">出題モード選択</p>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              {subject?.subjectName ?? subjectId}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {error && <ErrorMessage message={error} />}

        {/* Report selection */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowReportPicker((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-lg">📋</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800">レポート番号を選ぶ</p>
                <p className="text-xs text-slate-400">
                  {reportNos.length}種類のレポートがあります
                </p>
              </div>
            </div>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${showReportPicker ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showReportPicker && (
            <div className="border-t border-slate-100 px-5 pb-5">
              <div className="pt-4 flex flex-wrap gap-2 mb-4">
                {reportNos.map((no) => {
                  const checked = selectedReports.includes(no);
                  return (
                    <button
                      key={no}
                      id={`report-check-${no}`}
                      onClick={() => toggleReport(no)}
                      className={[
                        "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                        checked
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400",
                      ].join(" ")}
                    >
                      {checked && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      レポート {no}
                    </button>
                  );
                })}
              </div>
              <Button
                id="start-report-btn"
                variant="primary"
                size="md"
                fullWidth
                disabled={selectedReports.length === 0}
                onClick={startReportMode}
              >
                選択したレポートを開始（
                {questions.filter((q) => selectedReports.includes(q.reportNo)).length}問）
              </Button>
            </div>
          )}
        </section>

        {/* Wrong questions */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-lg">❌</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">間違えた問題</p>
                <p className="text-xs text-slate-400">
                  直近2回で間違えた問題を出題
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-sm font-semibold ${wrongQuestions.length > 0 ? "text-red-600" : "text-slate-400"}`}
              >
                対象: {wrongQuestions.length}問
              </span>
            </div>
          </div>
          <Button
            id="start-wrong-btn"
            variant="danger"
            size="md"
            fullWidth
            disabled={wrongQuestions.length === 0}
            onClick={startWrongMode}
            className="mt-4"
          >
            間違えた問題をやる
          </Button>
        </section>

        {/* Unsure questions */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-lg">🤔</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">迷った問題</p>
                <p className="text-xs text-slate-400">
                  「迷った」フラグをつけた問題を出題
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-sm font-semibold ${unsureQuestions.length > 0 ? "text-amber-600" : "text-slate-400"}`}
              >
                対象: {unsureQuestions.length}問
              </span>
            </div>
          </div>
          <Button
            id="start-unsure-btn"
            variant="warning"
            size="md"
            fullWidth
            disabled={unsureQuestions.length === 0}
            onClick={startUnsureMode}
            className="mt-4"
          >
            迷った問題をやる
          </Button>
        </section>
      </main>
    </div>
  );
};
