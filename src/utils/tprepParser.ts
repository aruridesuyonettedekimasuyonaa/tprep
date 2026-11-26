import type { TprepQuestion, Question, Subject } from "../types";

export interface ParseResult {
  subject: Subject;
  questions: Question[];
}

export interface ParseError {
  message: string;
}

function generateQuestionId(
  subjectId: string,
  q: TprepQuestion,
  idx: number
): string {
  return `${subjectId}-r${q.reportNo}-q${q.majorNo}-${q.minorNo}-${q.sortOrder ?? idx + 1}`;
}

export function parseTprepFile(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "JSONの解析に失敗しました。ファイルが破損しているか、形式が正しくありません。"
    );
  }

  const data = parsed as Record<string, unknown>;

  if (data.format !== "tprep") {
    throw new Error(
      `ファイル形式が不正です。"format" フィールドが "tprep" である必要があります（現在の値: ${JSON.stringify(data.format)}）`
    );
  }

  if (data.schemaVersion !== 1) {
    throw new Error(
      `未対応のスキーマバージョンです。バージョン 1 のみ対応しています（現在の値: ${JSON.stringify(data.schemaVersion)}）`
    );
  }

  const subject = data.subject as { subjectId?: unknown; subjectName?: unknown };
  if (
    !subject ||
    typeof subject.subjectId !== "string" ||
    subject.subjectId.trim() === "" ||
    typeof subject.subjectName !== "string" ||
    subject.subjectName.trim() === ""
  ) {
    throw new Error(
      '"subject.subjectId" と "subject.subjectName" は必須の文字列フィールドです。'
    );
  }

  const { subjectId, subjectName } = subject as { subjectId: string; subjectName: string };

  if (!Array.isArray(data.questions)) {
    throw new Error('"questions" フィールドは配列である必要があります。');
  }

  const questions: Question[] = (data.questions as TprepQuestion[]).map(
    (q, idx) => {
      if (
        typeof q.reportNo !== "number" ||
        typeof q.majorNo !== "number" ||
        typeof q.questionText !== "string" ||
        typeof q.answerText !== "string"
      ) {
        throw new Error(
          `questions[${idx}] のフィールドが不正です。reportNo, majorNo, questionText, answerText は必須です。`
        );
      }

      const questionId =
        typeof q.questionId === "string" && q.questionId.trim() !== ""
          ? q.questionId
          : generateQuestionId(subjectId, q, idx);

      return {
        questionId,
        subjectId,
        reportNo: q.reportNo,
        majorNo: q.majorNo,
        minorNo: q.minorNo ?? "",
        questionText: q.questionText,
        answerText: q.answerText,
        imageUrl: q.imageUrl ?? null,
        sortOrder: q.sortOrder ?? idx + 1,
      };
    }
  );

  return {
    subject: { subjectId, subjectName },
    questions,
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました。"));
    reader.readAsText(file, "utf-8");
  });
}

export function validateTprepFile(file: File): void {
  if (!file.name.endsWith(".tprep")) {
    throw new Error(
      `".tprep" 拡張子のファイルを選択してください（選択ファイル: ${file.name}）`
    );
  }
}
