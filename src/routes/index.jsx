import { Routes, Route } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import QuizLayout from "../layouts/QuizLayout";
import AddWordPage from "../pages/AddWordPage";
import LandingPage from "../pages/LandingPage";
import WordsPage from "../pages/WordsPage";
import GroupsPage from "../pages/GroupsPage";
import QuizPage from "../pages/QuizPage";
import NotFoundPage from "../pages/NotFoundPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import AuthCallbackPage from "../pages/AuthCallbackPage";
import OAuthConsentPage from "../pages/OAuthConsentPage";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* public landing + auth routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/oauth/consent" element={<OAuthConsentPage />} />

      {/* protected */}
      <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
        <Route path="/app" element={<AddWordPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/groups" element={<GroupsPage />} />
      </Route>
      <Route element={<ProtectedRoute><QuizLayout /></ProtectedRoute>}>
        <Route path="/quiz" element={<QuizPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
