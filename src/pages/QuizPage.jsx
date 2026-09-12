import { useNavigate } from "react-router-dom";
import Quiz from "../components/Quiz";
import { PATHS } from "../routes/paths";

export default function QuizPage() {
  const navigate = useNavigate();
  return (
    <Quiz
      onExit={() => navigate(PATHS.APP)}
      onNeedWords={() => navigate(PATHS.APP)}
    />
  );
}
