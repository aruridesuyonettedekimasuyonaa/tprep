import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider } from "./store/sessionStore";
import { HomeScreen } from "./components/screens/HomeScreen";
import { ModeSelectScreen } from "./components/screens/ModeSelectScreen";
import { ExerciseScreen } from "./components/screens/ExerciseScreen";
import { ResultScreen } from "./components/screens/ResultScreen";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/subject/:subjectId" element={<ModeSelectScreen />} />
          <Route path="/exercise" element={<ExerciseScreen />} />
          <Route path="/result" element={<ResultScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
};

export default App;
