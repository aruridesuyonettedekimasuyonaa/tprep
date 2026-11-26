// ============================================================
// .tprep ファイルスキーマ型
// ============================================================

export interface TprepQuestion {
  questionId?: string;
  reportNo: number;
  majorNo: number;
  minorNo: string | number;
  sortOrder: number;
  questionText: string;
  answerText: string;
  imageUrl?: string | null;
}

export interface TprepFile {
  format: "tprep";
  schemaVersion: 1;
  subject: {
    subjectId: string;
    subjectName: string;
  };
  questions: TprepQuestion[];
}

// ============================================================
// IndexedDB ストア型
// ============================================================

export interface Subject {
  subjectId: string;
  subjectName: string;
}

export interface Question {
  questionId: string;
  subjectId: string;
  reportNo: number;
  majorNo: number;
  minorNo: string | number;
  questionText: string;
  answerText: string;
  imageUrl: string | null;
  sortOrder: number;
}

export interface QuestionProgress {
  questionId: string;
  lastCorrect: boolean | null;
  secondLastCorrect: boolean | null;
  isUnsure: boolean;
  attemptCount: number;
  correctCount: number;
  updatedAt: string | null;
}

// ============================================================
// エクスポート・インポート用
// ============================================================

export interface ExportData {
  exportedAt: string;
  appVersion: string;
  subjects: Subject[];
  questions: Question[];
  progress: QuestionProgress[];
}

// ============================================================
// 演習セッション型
// ============================================================

export type ExerciseMode =
  | { type: "report"; subjectId: string; reportNos: number[] }
  | { type: "wrong"; subjectId: string }
  | { type: "unsure"; subjectId: string }
  | { type: "result-wrong"; subjectId: string; questionIds: string[] }
  | { type: "result-unsure"; subjectId: string; questionIds: string[] };

export interface AnswerRecord {
  questionId: string;
  isCorrect: boolean;
}

export interface SessionState {
  mode: ExerciseMode;
  questions: Question[];
  currentIndex: number;
  // questionId -> isCorrect (最後の回答で上書き、二重カウント防止)
  answers: Record<string, boolean>;
  // 迷ったフラグ（トグル状態）
  unsureIds: Set<string>;
  // 答えを見ているか
  isAnswerVisible: boolean;
}

export type SessionAction =
  | { type: "INIT"; questions: Question[]; mode: ExerciseMode; initialUnsureIds: Set<string> }
  | { type: "ANSWER"; questionId: string; isCorrect: boolean }
  | { type: "TOGGLE_UNSURE"; questionId: string }
  | { type: "SHOW_ANSWER" }
  | { type: "NEXT" }
  | { type: "PREV" };
