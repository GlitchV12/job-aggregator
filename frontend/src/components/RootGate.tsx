import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Landing from "../pages/Landing";

const VISITED_KEY = "jobagg_visited";

export default function RootGate() {
  const { user, loading } = useAuth();
  const hasVisited = localStorage.getItem(VISITED_KEY) === "1";

  useEffect(() => {
    if (!loading && !hasVisited) {
      localStorage.setItem(VISITED_KEY, "1");
    }
  }, [loading, hasVisited]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-950" />;
  }

  if (user || hasVisited) {
    return <Navigate to="/jobs" replace />;
  }

  return <Landing />;
}
