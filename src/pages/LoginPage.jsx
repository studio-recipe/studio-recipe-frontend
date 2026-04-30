import { useState } from "react";
import { publicFetch, saveTokens } from "../lib/api";
import "./auth.css";

export default function LoginPage({ onLoginSuccess, onGoRegister }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokenResponse = await publicFetch("/auth/login", {
        method: "POST",
        body: { id, password }, // UserLoginRequestDTO
      });

      saveTokens(tokenResponse);
      onLoginSuccess?.();
    } catch (e2) {
      setError(e2?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="authBg" />
      <form className="authBox" onSubmit={submit}>
        <div className="brandRow">
          <div className="brandLogo">🍳</div>
          <div>
            <div className="brand">원룸 레시피</div>
            <div className="brandSub">오늘 뭐 먹지? 개인 맞춤 추천</div>
          </div>
        </div>

        <div className="authTitle">로그인</div>

        <div className="authForm">
          <div className="field">
            <div className="label">아이디</div>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="8~16자 아이디"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <div className="label">비밀번호</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="대/소문자+숫자+특수문자 포함"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="errorBox">{error}</div>}

          <button className="primaryBtn" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div className="authFooter">
            <span>계정이 없나요?</span>
            <button className="linkBtn" type="button" onClick={onGoRegister}>
              회원가입
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}