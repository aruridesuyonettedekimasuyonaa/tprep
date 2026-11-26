import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubjects } from "../../hooks/useSubjects";
import { Button } from "../common/Button";
import { ErrorMessage, SuccessMessage } from "../common/ErrorMessage";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { exportAllData, importAllData } from "../../utils/exportImport";

const SAMPLE_FILES = [
  { label: "数学I サンプル", url: "/samples/math1.tprep" },
  { label: "英語 サンプル", url: "/samples/english.tprep" },
];

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    subjects,
    loading,
    error,
    loadSubjects,
    importTprepFile,
    importTprepFromUrl,
    deleteSubject,
    clearError,
  } = useSubjects();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const name = await importTprepFile(file);
      setSuccessMsg(`「${name}」を読み込みました。`);
    } catch {
      // error is set by hook
    }
  };

  const handleSampleLoad = async (url: string, label: string) => {
    try {
      const name = await importTprepFromUrl(url);
      setSuccessMsg(`「${name}」を読み込みました。`);
    } catch {
      setActionError(`サンプルの読み込みに失敗しました: ${label}`);
    }
  };

  const handleExport = async () => {
    try {
      await exportAllData();
      setSuccessMsg("データをエクスポートしました。");
    } catch (e) {
      setActionError("エクスポートに失敗しました。");
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      await importAllData(file);
      await loadSubjects();
      setSuccessMsg("バックアップを復元しました。");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "インポートに失敗しました。"
      );
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`「${subjectName}」とすべての学習データを削除しますか？`)) return;
    try {
      await deleteSubject(subjectId);
      setSuccessMsg(`「${subjectName}」を削除しました。`);
    } catch {
      setActionError("削除に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              テスト対策アプリ
            </h1>
          </div>
          <span className="text-xs text-slate-400 font-medium">tprep</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Messages */}
        {(error || actionError) && (
          <ErrorMessage
            message={error || actionError || ""}
            onClose={() => {
              clearError();
              setActionError(null);
            }}
          />
        )}
        {successMsg && (
          <SuccessMessage
            message={successMsg}
            onClose={() => setSuccessMsg(null)}
          />
        )}

        {/* Subject list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">登録済みの教科</h2>
            <span className="text-sm text-slate-400">{subjects.length}件</span>
          </div>

          {loading ? (
            <LoadingSpinner message="教科を読み込み中..." />
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-slate-500 text-sm">
                まだ教科が登録されていません。
                <br />
                下の「教科を追加」または「サンプルを読み込む」から始めてください。
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {subjects.map((s) => (
                <li key={s.subjectId}>
                  <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <button
                      id={`subject-${s.subjectId}`}
                      onClick={() => navigate(`/subject/${s.subjectId}`)}
                      className="flex-1 flex items-center gap-3 px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset rounded-2xl"
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-lg">📖</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{s.subjectName}</p>
                        <p className="text-xs text-slate-400">{s.subjectId}</p>
                      </div>
                      <svg
                        className="ml-auto h-5 w-5 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(s.subjectId, s.subjectName)}
                      aria-label={`${s.subjectName}を削除`}
                      className="p-3 mr-2 text-slate-300 hover:text-red-400 transition-colors rounded-xl"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Add subject */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-700">教科を追加</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tprep"
            onChange={handleFileChange}
            className="hidden"
            id="tprep-file-input"
          />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            .tprep ファイルを読み込む
          </Button>

          {/* Samples */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">サンプルデータ</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_FILES.map((s) => (
                <Button
                  key={s.url}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSampleLoad(s.url, s.label)}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Backup */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-semibold text-slate-700">データのバックアップ</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              エクスポート
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
              id="backup-import-input"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => importInputRef.current?.click()}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              インポート（復元）
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            全教科・問題・学習履歴をJSONファイルでバックアップできます。
          </p>
        </section>
      </main>
    </div>
  );
};
