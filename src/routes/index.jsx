import { Routes, Route } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import QuizLayout from "../layouts/QuizLayout";
import AddWordPage from "../pages/AddWordPage";
import WordsPage from "../pages/WordsPage";
import GroupsPage from "../pages/GroupsPage";
import QuizPage from "../pages/QuizPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<AddWordPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
      </Route>
      <Route element={<QuizLayout />}>
        <Route path="/quiz" element={<QuizPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
