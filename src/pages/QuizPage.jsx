import { useNavigate } from "react-router-dom";
import Quiz from "../components/Quiz";
import { PATHS } from "../routes/paths";

export default function QuizPage() {
  const navigate = useNavigate();
  return (
    <Quiz
      onExit={() => navigate(PATHS.HOME)}
      onNeedWords={() => navigate(PATHS.HOME)}
    />
  );
}
