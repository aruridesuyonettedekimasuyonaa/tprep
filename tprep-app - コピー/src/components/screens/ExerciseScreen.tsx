import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../store/sessionStore";
import { Button } from "../common/Button";
import { ErrorMessage } from "../common/ErrorMessage";
import { recordAnswer as dbRecordAnswer, toggleUnsure as dbToggleUnsure } from "../../db/operations";

export const ExerciseScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const { questions, currentIndex, answers, unsureIds, isAnswerVisible } = state;

  const [saveError, setSaveError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const currentAnswer = question ? answers[question.questionId] : undefined;
  const isUnsure = question ? unsureIds.has(question.questionId) : false;

  // If no session, redirect home
  useEffect(() => {
    if (questions.length === 0) {
      navigate("/");
    }
  }, [questions.length, navigate]);

  if (!question) return null;

  const handleAnswer = async (isCorrect: boolean) => {
    const previousAnswer = answers[question.questionId];
    const isSameAnswer = previousAnswer === isCorrect;

    // セッション内での表示状態を更新（二重カウント防止のため、押し直しはDBに書かない）
    if (!isSameAnswer) {
      dispatch({ type: "ANSWER", questionId: question.questionId, isCorrect });

      // DB への書き込みは初回回答のみ
      if (previousAnswer === undefined) {
        try {
          await dbRecordAnswer(question.questionId, isCorrect);
        } catch (e) {
          setSaveError(
            e instanceof Error ? e.message : "回答の保存に失敗しました。"
          );
        }
      }
    }
  };

  const handleToggleUnsure = async () => {
    dispatch({ type: "TOGGLE_UNSURE", questionId: question.questionId });
    try {
      await dbToggleUnsure(question.questionId);
    } catch (e) {
      setSaveError("迷ったフラグの保存に失敗しました。");
    }
  };

  const handleNext = () => {
    if (isLast) {
      navigate("/result");
    } else {
      dispatch({ type: "NEXT" });
    }
  };

  const handleExit = () => {
    navigate("/result");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Question meta */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium min-w-0">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                R{question.reportNo}
              </span>
              <span className="text-slate-300">|</span>
              <span className="whitespace-nowrap">
                問 {question.majorNo}–{question.minorNo}
              </span>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-slate-700">
                {currentIndex + 1}
                <span className="text-slate-400 font-normal"> / {questions.length}</span>
              </span>
              <button
                onClick={() => setShowExitConfirm(true)}
                className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="途中終了"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-5 flex flex-col gap-4">
        {saveError && (
          <ErrorMessage message={saveError} onClose={() => setSaveError(null)} />
        )}

        {/* Question card */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <p className="text-xs text-slate-400 font-medium mb-2">問題</p>
          <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
            {question.questionText}
          </p>

          {question.imageUrl && (
            <div className="mt-4">
              <img
                src={question.imageUrl}
                alt="問題の図"
                className="max-w-full rounded-xl border border-slate-200"
              />
            </div>
          )}
        </div>

        {/* Answer card (shown after tap) */}
        {!isAnswerVisible ? (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => dispatch({ type: "SHOW_ANSWER" })}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.964-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            答えを見る
          </Button>
        ) : (
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm p-5 animate-fade-in">
            <p className="text-xs text-indigo-500 font-medium mb-2">答え</p>
            <p className="text-indigo-900 text-base leading-relaxed font-semibold whitespace-pre-wrap">
              {question.answerText}
            </p>
          </div>
        )}

        {/* Answer buttons */}
        {isAnswerVisible && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              id={`btn-correct-${question.questionId}`}
              variant={currentAnswer === true ? "success" : "secondary"}
              size="lg"
              fullWidth
              onClick={() => handleAnswer(true)}
              className={
                currentAnswer === true
                  ? "ring-2 ring-emerald-400 ring-offset-2"
                  : ""
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              正解
            </Button>
            <Button
              id={`btn-wrong-${question.questionId}`}
              variant={currentAnswer === false ? "danger" : "secondary"}
              size="lg"
              fullWidth
              onClick={() => handleAnswer(false)}
              className={
                currentAnswer === false
                  ? "ring-2 ring-red-400 ring-offset-2"
                  : ""
              }
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              不正解
            </Button>
          </div>
        )}

        {/* Unsure toggle */}
        <button
          id={`btn-unsure-${question.questionId}`}
          onClick={handleToggleUnsure}
          className={[
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
            isUnsure
              ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
              : "bg-white border-slate-300 text-slate-500 hover:border-amber-400 hover:text-amber-600",
          ].join(" ")}
        >
          <span className="text-base">{isUnsure ? "🤔" : "😐"}</span>
          {isUnsure ? "迷った（タップで解除）" : "迷った"}
        </button>

        {/* Navigation */}
        <div className="flex gap-3 mt-auto pb-4">
          <Button
            variant="ghost"
            size="md"
            disabled={currentIndex === 0}
            onClick={() => dispatch({ type: "PREV" })}
            className="px-3"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button
            id={isLast ? "btn-finish" : "btn-next"}
            variant="primary"
            size="md"
            fullWidth
            onClick={handleNext}
          >
            {isLast ? "終了してリザルトへ" : "次へ"}
            {!isLast && (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Button>
        </div>
      </main>

      {/* Exit confirm dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold text-slate-800">演習を終了しますか？</h2>
            <p className="text-sm text-slate-500">
              現在までの回答はリザルト画面で確認できます。
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => setShowExitConfirm(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                onClick={handleExit}
              >
                終了する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
