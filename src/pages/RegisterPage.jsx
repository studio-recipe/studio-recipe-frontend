import { useState } from "react";
import { publicFetch } from "../lib/api";
import "./auth.css";

export default function RegisterPage({ onGoLogin }) {
  const [form, setForm] = useState({
    id: "",
    password: "",
    name: "",
    nickname: "",
    email: "",
    birth: "", // yyyy-MM-dd
    gender: "M", // 서버 enum: M/F
  });

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    try {
      await publicFetch("/auth/register", {
        method: "POST",
        body: {
          id: form.id,
          password: form.password,
          name: form.name,
          nickname: form.nickname,
          email: form.email,
          birth: form.birth, // "2025-12-09"
          gender: form.gender, // ✅ "M" | "F"
        },
      });

      setOk("회원가입이 완료되었습니다. 로그인 해주세요.");
      // Auto-navigate to login after 2 seconds
      setTimeout(() => {
        onGoLogin();
      }, 2000);
    } catch (e2) {
      setError(e2.message || "회원가입 실패");
    }
  }

  return (
    <div className="authWrap">
      <div className="authBox">
        <div className="brandRow">
          <div className="brandIcon">✨</div>
          <div>
            <div className="brand">원룸 레시피</div>
            <div className="brandDesc">가입하고 개인 맞춤 추천을 받아보세요</div>
          </div>
        </div>

        <div className="authTitle">회원가입</div>

        <form className="authForm grid2" onSubmit={submit}>
          <div className="field">
            <div className="label">아이디 (8~16자)</div>
            <input
              value={form.id}
              onChange={(e) => setField("id", e.target.value)}
              minLength={8}
              maxLength={16}
              required
              placeholder="8~16자 아이디"
            />
          </div>

          <div className="field">
            <div className="label">비밀번호</div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              placeholder="대/소문자+숫자+특수문자 포함"
            />
          </div>

          <div className="field">
            <div className="label">이름</div>
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
          </div>

          <div className="field">
            <div className="label">닉네임</div>
            <input value={form.nickname} onChange={(e) => setField("nickname", e.target.value)} required />
          </div>

          <div className="field">
            <div className="label">이메일</div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <div className="label">생년월일</div>
            <input
              type="date"
              value={form.birth}
              onChange={(e) => setField("birth", e.target.value)}
              required
            />
          </div>

          <div className="field span2">
            <div className="label">성별</div>
            <select value={form.gender} onChange={(e) => setField("gender", e.target.value)} required>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>

          {error && <div className="errorBox span2">{error}</div>}
          {ok && <div className="okBox span2">{ok}</div>}

          {/* 버튼이 아래로 빠지는 문제: span2 + width 100% */}
          <button className="primaryBtn span2" type="submit">
            가입하기
          </button>

          <div className="authFooter span2">
            <span>이미 계정이 있나요?</span>
            <button type="button" className="linkBtn" onClick={onGoLogin}>
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}