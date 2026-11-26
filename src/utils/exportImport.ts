import type { ExportData } from "../types";
import { getAllSubjects, getAllQuestions, getAllProgress } from "../db/operations";
import {
  putSubject,
  putQuestions,
  putAllProgress,
} from "../db/operations";

export async function exportAllData(): Promise<void> {
  const [subjects, questions, progress] = await Promise.all([
    getAllSubjects(),
    getAllQuestions(),
    getAllProgress(),
  ]);

  const exportData: ExportData = {
    exportedAt: new Date().toISOString(),
    appVersion: "1.0.0",
    subjects,
    questions,
    progress,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tprep-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importAllData(file: File): Promise<void> {
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました。"));
    reader.readAsText(file, "utf-8");
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSONの解析に失敗しました。バックアップファイルが破損しています。");
  }

  const data = parsed as ExportData;

  if (!Array.isArray(data.subjects) || !Array.isArray(data.questions)) {
    throw new Error(
      "バックアップファイルの形式が正しくありません。subjects と questions フィールドが必要です。"
    );
  }

  // Import subjects
  for (const s of data.subjects) {
    await putSubject(s);
  }

  // Import questions in bulk
  if (data.questions.length > 0) {
    await putQuestions(data.questions);
  }

  // Import progress in bulk
  if (Array.isArray(data.progress) && data.progress.length > 0) {
    await putAllProgress(data.progress);
  }
}
