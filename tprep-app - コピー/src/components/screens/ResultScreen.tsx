import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../store/sessionStore";
import { Button } from "../common/Button";
import type { ExerciseMode } from "../../types";

export const ResultScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, initSession } = useSession();
  const { questions, answers, unsureIds, mode } = state;

  const totalAnswered = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(Boolean).length;
  const wrongCount = totalAnswered - correctCount;
  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const subjectId =
    "subjectId" in mode ? (mode as { subjectId: string }).subjectId : "";

  // Questions answered wrong in this session
  const wrongQuestionsInSession = useMemo(() => {
    return questions.filter(
      (q) => answers[q.questionId] === false
    );
  }, [questions, answers]);

  // Questions marked unsure in this session
  const unsureQuestionsInSession = useMemo(() => {
    return questions.filter((q) => unsureIds.has(q.questionId));
  }, [questions, unsureIds]);

  const handleRetryWrong = () => {
    if (wrongQuestionsInSession.length === 0) return;
    const sorted = [...wrongQuestionsInSession].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    const newMode: ExerciseMode = {
      type: "result-wrong",
      subjectId,
      questionIds: sorted.map((q) => q.questionId),
    };
    const newUnsure = new Set(
      sorted
        .filter((q) => unsureIds.has(q.questionId))
        .map((q) => q.questionId)
    );
    initSession(newMode, sorted, newUnsure);
    navigate("/exercise");
  };

  const handleRetryUnsure = () => {
    if (unsureQuestionsInSession.length === 0) return;
    const sorted = [...unsureQuestionsInSession].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    const newMode: ExerciseMode = {
      type: "result-unsure",
      subjectId,
      questionIds: sorted.map((q) => q.questionId),
    };
    const newUnsure = new Set(sorted.map((q) => q.questionId));
    initSession(newMode, sorted, newUnsure);
    navigate("/exercise");
  };

  const handleBack = () => {
    if (subjectId) {
      navigate(`/subject/${subjectId}`);
    } else {
      navigate("/");
    }
  };

  // Accuracy color
  const accuracyColor =
    accuracy >= 80
      ? "text-emerald-600"
      : accuracy >= 50
      ? "text-amber-600"
      : "text-red-600";

  const accuracyBg =
    accuracy >= 80
      ? "from-emerald-50 to-teal-50 border-emerald-200"
      : accuracy >= 50
      ? "from-amber-50 to-yellow-50 border-amber-200"
      : "from-red-50 to-rose-50 border-red-200";

  const accuracyMessage =
    accuracy === 100
      ? "🎉 パーフェクト！素晴らしい！"
      : accuracy >= 80
      ? "✨ よくできました！"
      : accuracy >= 50
      ? "💪 もう少し！"
      : "📖 復習を頑張りましょう！";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="text-lg font-bold text-slate-800">演習結果</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        {/* Score card */}
        <section
          className={`rounded-2xl bg-gradient-to-br ${accuracyBg} border p-6 text-center space-y-2 shadow-sm`}
        >
          <p className="text-sm font-medium text-slate-500">{accuracyMessage}</p>
          <div className={`text-6xl font-black tracking-tight ${accuracyColor}`}>
            {accuracy}%
          </div>
          <p className="text-sm text-slate-500">
            {totalAnswered}問中 {correctCount}問正解
          </p>
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-slate-800">{questions.length}</p>
            <p className="text-xs text-slate-400 mt-1">出題数</p>
          </div>
          <div className="rounded-2xl bg-white border border-emerald-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">{correctCount}</p>
            <p className="text-xs text-slate-400 mt-1">正解</p>
          </div>
          <div className="rounded-2xl bg-white border border-red-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-red-500">{wrongCount}</p>
            <p className="text-xs text-slate-400 mt-1">不正解</p>
          </div>
        </div>

        {/* Retry section */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-700">復習する</h2>

          <Button
            id="retry-unsure-btn"
            variant="warning"
            size="lg"
            fullWidth
            disabled={unsureQuestionsInSession.length === 0}
            onClick={handleRetryUnsure}
          >
            <span>🤔</span>
            迷った問題をやる
            <span
              className={`ml-auto text-sm font-normal ${unsureQuestionsInSession.length > 0 ? "" : "opacity-60"}`}
            >
              {unsureQuestionsInSession.length}問
            </span>
          </Button>

          <Button
            id="retry-wrong-btn"
            variant="danger"
            size="lg"
            fullWidth
            disabled={wrongQuestionsInSession.length === 0}
            onClick={handleRetryWrong}
          >
            <span>❌</span>
            間違えた問題をやる
            <span
              className={`ml-auto text-sm font-normal ${wrongQuestionsInSession.length > 0 ? "" : "opacity-60"}`}
            >
              {wrongQuestionsInSession.length}問
            </span>
          </Button>
        </section>

        {/* Wrong list */}
        {wrongQuestionsInSession.length > 0 && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">
              今回間違えた問題（{wrongQuestionsInSession.length}問）
            </h2>
            <ul className="space-y-2">
              {wrongQuestionsInSession.map((q) => (
                <li
                  key={q.questionId}
                  className="rounded-xl bg-red-50 border border-red-100 px-4 py-3"
                >
                  <p className="text-xs text-red-400 font-medium mb-1">
                    R{q.reportNo} 問{q.majorNo}–{q.minorNo}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-2">
                    {q.questionText}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Back button */}
        <Button variant="ghost" size="lg" fullWidth onClick={handleBack}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          出題モード選択に戻る
        </Button>
      </main>
    </div>
  );
};
