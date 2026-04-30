import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import "./adminTrain.css";

export default function AdminTrainPage({ onBack }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  async function loadStatus(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/admin/train-bpr/status");
      // 기대 형태: { ok:true, state:{ running, last_started_at, ... } }
      setState(data?.state || null);
    } catch (e) {
      setError(e.message || "상태 조회 실패");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function startTrain() {
    if (starting) return;
    setStarting(true);
    setError("");
    try {
      // 브라우저에서 GET이 아니라 POST로 호출
      await apiFetch("/admin/train-bpr", { method: "POST" });

      // 시작 직후 상태 즉시 갱신
      await loadStatus(true);
    } catch (e) {
      setError(e.message || "학습 시작 실패");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    loadStatus();

    // 1~2초 폴링 (너무 촘촘하면 서버 부담)
    timerRef.current = setInterval(() => {
      loadStatus(true);
    }, 1500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = Boolean(state?.running);

  return (
    <div className="adminRoot">
      <header className="adminHeader">
        <button className="adminBack" onClick={onBack}>
          ← 뒤로
        </button>
        <div className="adminTitle">BPR 학습 관리자</div>
        <div className="adminRight" />
      </header>

      <main className="adminContainer">
        <section className="panel">
          <div className="panelTop">
            <div className="panelTitle">학습 상태</div>
            <div className={`badge ${running ? "on" : "off"}`}>
              {running ? "RUNNING" : "IDLE"}
            </div>
          </div>

          {loading && !state ? (
            <div className="hint">불러오는 중...</div>
          ) : (
            <div className="kv">
              <Row k="running" v={String(running)} />
              <Row k="last_started_at" v={state?.last_started_at || "-"} />
              <Row k="last_finished_at" v={state?.last_finished_at || "-"} />
              <Row
                k="last_success"
                v={
                  state?.last_success === null
                    ? "-"
                    : String(state?.last_success)
                }
              />
              <Row k="last_error" v={state?.last_error || "-"} />
            </div>
          )}

          {error && <div className="errorBox">{error}</div>}

          <div className="actions">
            <button
              className="primaryBtn"
              onClick={startTrain}
              disabled={running || starting}
              title={running ? "학습 중에는 시작할 수 없습니다." : "학습 시작"}
            >
              {running
                ? "학습 진행 중..."
                : starting
                ? "요청 중..."
                : "학습 시작"}
            </button>

            <button className="ghostBtn" onClick={() => loadStatus()}>
              새로고침
            </button>
          </div>

          <div className="desc">
            <div className="descTitle">주의</div>
            <ul>
              <li>
                브라우저 주소창은 GET만 보내서 학습 시작이 안 됩니다. (POST
                필요)
              </li>
              <li>
                학습은 시간이 걸릴 수 있으며, running=true 동안 버튼이
                비활성화됩니다.
              </li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="panelTop">
            <div className="panelTitle">추천 품질 평가란?</div>
          </div>
          <div className="desc">
            <p>
              추천 품질 평가는 “사용자에게 실제로 좋아할 만한 아이템을 상위
              K개에 얼마나 잘 넣었는가”를 측정합니다. 보통 로그를{" "}
              <b>학습/검증으로 나누고</b>, 검증에서 정답(실제 클릭/좋아요)을
              맞히는 비율을 봅니다.
            </p>
            <ul>
              <li>
                <b>Recall@K</b>: 정답 아이템이 Top-K 안에 포함되는 비율
              </li>
              <li>
                <b>NDCG@K</b>: 정답이 더 위에 랭크될수록 더 높은 점수(랭킹 품질)
              </li>
            </ul>
            <p className="muted">
              ※ 지금은 화면에 “개념/지표”를 보여주고, 실제 점수 계산은 아래의
              Python 평가 스크립트 템플릿으로 붙이면 됩니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="row">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
