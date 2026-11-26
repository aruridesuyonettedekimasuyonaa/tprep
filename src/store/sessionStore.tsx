import React, {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type {
  SessionState,
  SessionAction,
  Question,
  ExerciseMode,
} from "../types";

const initialState: SessionState = {
  mode: { type: "report", subjectId: "", reportNos: [] },
  questions: [],
  currentIndex: 0,
  answers: {},
  unsureIds: new Set(),
  isAnswerVisible: false,
};

function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "INIT":
      return {
        ...initialState,
        mode: action.mode,
        questions: action.questions,
        unsureIds: new Set(action.initialUnsureIds),
      };

    case "ANSWER": {
      const newAnswers = {
        ...state.answers,
        [action.questionId]: action.isCorrect,
      };
      return { ...state, answers: newAnswers };
    }

    case "TOGGLE_UNSURE": {
      const newUnsure = new Set(state.unsureIds);
      if (newUnsure.has(action.questionId)) {
        newUnsure.delete(action.questionId);
      } else {
        newUnsure.add(action.questionId);
      }
      return { ...state, unsureIds: newUnsure };
    }

    case "SHOW_ANSWER":
      return { ...state, isAnswerVisible: true };

    case "NEXT":
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
        isAnswerVisible: false,
      };

    case "PREV":
      return {
        ...state,
        currentIndex: Math.max(state.currentIndex - 1, 0),
        isAnswerVisible: false,
      };

    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  initSession: (
    mode: ExerciseMode,
    questions: Question[],
    initialUnsureIds?: Set<string>
  ) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const initSession = (
    mode: ExerciseMode,
    questions: Question[],
    initialUnsureIds: Set<string> = new Set()
  ) => {
    dispatch({ type: "INIT", mode, questions, initialUnsureIds });
  };

  return (
    <SessionContext.Provider value={{ state, dispatch, initSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
