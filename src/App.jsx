import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecipeMainPage from "./pages/RecipeMainPage";
import AdminPage from "./pages/AdminPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import { getAccessToken, clearTokens } from "./lib/api";

export default function App() {
  const [route, setRoute] = useState(() => (getAccessToken() ? "main" : "login"));
  const [detailId, setDetailId] = useState(null);

  // Debug log to see current route
  console.log("Current route:", route, "Has token:", !!getAccessToken());

  // 토큰 만료/401 등으로 api.js가 auth:logout 이벤트를 쏘면 여기서 처리
  useEffect(() => {
    const handler = () => {
      clearTokens();
      setRoute("login");
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  // 로그인 안 됐는데 protected 화면이면 로그인으로
  if (!getAccessToken() && route !== "login" && route !== "register") {
    setRoute("login");
  }

  if (route === "login") {
    return (
      <LoginPage
        onGoRegister={() => setRoute("register")}
        onLoginSuccess={() => setRoute("main")}
      />
    );
  }

  if (route === "register") {
    return <RegisterPage onGoLogin={() => setRoute("login")} />;
  }

  if (route === "admin") {
    // AdminPage에 onBack 넘기고, 버튼 누르면 setRoute("main") 하게 만들면 됨
    return <AdminPage onBack={() => setRoute("main")} />;
  }

  if (route === "detail") {
    return <RecipeDetailPage recipeId={detailId} onBack={() => setRoute("main")} />;
  }

  // main - explicitly ensure RecipeMainPage is rendered
  if (route === "main") {
    return (
      <RecipeMainPage
        onGoDetail={(id) => {
          setDetailId(id);
          setRoute("detail");
        }}
        onGoAdmin={() => setRoute("admin")}
        onGoLogin={() => setRoute("login")}
        onLogout={() => {
          clearTokens();
          setRoute("login");
        }}
      />
    );
  }

  // fallback - should not reach here
  return (
    <RecipeMainPage
      onGoDetail={(id) => {
        setDetailId(id);
        setRoute("detail");
      }}
      onGoAdmin={() => setRoute("admin")}
      onGoLogin={() => setRoute("login")}
      onLogout={() => {
        clearTokens();
        setRoute("login");
      }}
    />
  );
}
