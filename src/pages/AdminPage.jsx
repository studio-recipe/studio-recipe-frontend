import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import "./admin.css";

/**
 * SpringBoot API
 * - POST /admin/train-bpr
 * - GET  /admin/train-bpr/status
 * - GET  /admin/metrics
 * - POST /admin/metrics/recompute
 */

function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}
function safeStr(v) {
  if (v == null) return "—";
  return String(v);
}

function gradeMetric(name, value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return { label: "미측정", cls: "g-gray" };

  if (name === "coverage") {
    if (v >= 0.35) return { label: "좋음", cls: "g-good" };
    if (v >= 0.20) return { label: "보통", cls: "g-warn" };
    return { label: "낮음", cls: "g-bad" };
  }
  if (v >= 0.18) return { label: "좋음", cls: "g-good" };
  if (v >= 0.08) return { label: "보통", cls: "g-warn" };
  return { label: "낮음", cls: "g-bad" };
}

function pickFirst(obj, keys, fallback = null) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

/** Flask/Spring 어디서 오든 최대한 필드명 자동 추정 */
function normalizeMetrics(anyMetrics) {
  const m = anyMetrics || {};
  // 가능한 키 후보를 넓게 잡아둠 (네가 말한 "파라미터 이름이 잘못된 것 같다" 대응)
  const recall = pickFirst(m, ["recallAt10", "recall_at_10", "recall@10", "recallAtK", "recall", "recall10", "recall_at10"], 0);
  const ndcg = pickFirst(m, ["ndcgAt10", "ndcg_at_10", "ndcg@10", "ndcgAtK", "ndcg", "ndcg10", "ndcg_at10"], 0);
  const hit = pickFirst(m, ["hitRateAt10", "hit_rate_at_10", "hit@10", "hitRate", "hit", "hit10", "hit_rate10"], 0);
  const cov = pickFirst(m, ["coverage", "cov", "coverageRate", "coverage_rate", "itemCoverage", "item_coverage"], 0);

  const createdAt = pickFirst(m, ["createdAt", "created_at", "time", "timestamp"], null);

  return { recallAt10: recall, ndcgAt10: ndcg, hitRateAt10: hit, coverage: cov, createdAt };
}

export default function AdminPage({ onBack }) {
  const [train, setTrain] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const [loadingTrain, setLoadingTrain] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [busyTrainStart, setBusyTrainStart] = useState(false);
  const [busyRecompute, setBusyRecompute] = useState(false);

  const [err, setErr] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  // 폴링 컨트롤
  const pollTimerRef = useRef(null);
  const pollStopRef = useRef(false);

  function stopPolling() {
    pollStopRef.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  async function loadTrainStatus({ silent = false } = {}) {
    if (!silent) {
      setLoadingTrain(true);
      setErr("");
    }
    try {
      const data = await apiFetch("/admin/train-bpr/status", { method: "GET" });
      setTrain(data);
      return data;
    } catch (e) {
      if (!silent) setErr(e?.message || "학습 상태 조회 실패");
      setTrain(null);
      return null;
    } finally {
      if (!silent) setLoadingTrain(false);
    }
  }

  async function loadMetrics({ silent = false } = {}) {
    if (!silent) {
      setLoadingMetrics(true);
      setErr("");
    }
    try {
      const data = await apiFetch("/admin/metrics", { method: "GET" });
      setMetrics(data);
      return data;
    } catch (e) {
      if (!silent) setErr(e?.message || "지표 조회 실패");
      setMetrics(null);
      return null;
    } finally {
      if (!silent) setLoadingMetrics(false);
    }
  }

  // 학습 시작 후 자동 폴링: running=false 되는 순간 자동으로 배지 갱신
  async function startTrain() {
    setBusyTrainStart(true);
    setErr("");
    stopPolling();
    try {
      await apiFetch("/admin/train-bpr", { method: "POST" });

      // 바로 한 번 갱신
      const first = await loadTrainStatus({ silent: true });
      // 폴링 시작
      pollStopRef.current = false;

      const poll = async () => {
        if (pollStopRef.current) return;

        const latest = await loadTrainStatus({ silent: true });
        const s = latest?.state || latest || {};
        const running = !!(s.running ?? s?.state?.running);

        // running이 false로 내려오면 폴링 종료
        if (!running) {
          stopPolling();
          setBusyTrainStart(false);
          return;
        }
        // 계속 running이면 1.5초 후 재시도
        pollTimerRef.current = setTimeout(poll, 1500);
      };

      // 만약 처음부터 running이 false면 바로 종료
      const s0 = first?.state || first || {};
      const running0 = !!(s0.running ?? s0?.state?.running);
      if (!running0) {
        stopPolling();
        setBusyTrainStart(false);
        return;
      }

      pollTimerRef.current = setTimeout(poll, 1200);
    } catch (e) {
      setErr(e?.message || "학습 시작 실패");
      stopPolling();
      setBusyTrainStart(false);
    }
  }

  // 지표 재계산: 재계산 후 자동으로 metrics 갱신
  async function recomputeMetrics() {
    setBusyRecompute(true);
    setErr("");
    try {
      await apiFetch("/admin/metrics/recompute", { method: "POST" });
      await loadMetrics({ silent: true });
    } catch (e) {
      setErr(e?.message || "지표 재계산 실패");
    } finally {
      setBusyRecompute(false);
    }
  }

  useEffect(() => {
    loadTrainStatus();
    loadMetrics();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trainState = useMemo(() => {
    const t = train || {};
    const s = t.state || t;
    return {
      running: !!s.running,
      lastSuccess: s.lastSuccess ?? s.last_success ?? s.success ?? null,
      lastError: s.lastError ?? s.last_error ?? s.error ?? null,
      lastStartedAt: s.lastStartedAt ?? s.last_started_at ?? s.startedAt ?? null,
      lastFinishedAt: s.lastFinishedAt ?? s.last_finished_at ?? s.finishedAt ?? null,
      serverTime: s.serverTime ?? s.server_time ?? null,
    };
  }, [train]);

  const trainBadge = trainState.running
    ? { text: "학습 진행 중", cls: "pill pill-running" }
    : trainState.lastSuccess === true
      ? { text: "최근 학습 성공", cls: "pill pill-ok" }
      : trainState.lastSuccess === false
        ? { text: "최근 학습 실패", cls: "pill pill-bad" }
        : { text: "학습 대기", cls: "pill pill-gray" };

  const normalizedMetrics = useMemo(() => normalizeMetrics(metrics), [metrics]);

  const metricItems = [
    {
      key: "recallAt10",
      title: "Recall@10",
      value: normalizedMetrics.recallAt10,
      display: fmtPct(normalizedMetrics.recallAt10),
      desc:
        "추천 10개 안에 ‘정답(사용자가 실제로 좋아할만한 것)’이 얼마나 포함되는지.\n높을수록 개인화 추천이 잘 맞습니다.",
      range: "보통 0.05~0.20",
    },
    {
      key: "ndcgAt10",
      title: "NDCG@10",
      value: normalizedMetrics.ndcgAt10,
      display: fmtPct(normalizedMetrics.ndcgAt10),
      desc:
        "추천 순서 품질. 좋은 아이템이 ‘앞쪽’에 배치될수록 점수가 높습니다.\n높을수록 사용자 만족이 좋아지는 경향이 있어요.",
      range: "보통 0.05~0.25",
    },
    {
      key: "hitRateAt10",
      title: "HitRate@10",
      value: normalizedMetrics.hitRateAt10,
      display: fmtPct(normalizedMetrics.hitRateAt10),
      desc:
        "추천 10개 중 ‘정답’이 1개라도 있으면 HIT.\n높을수록 최소 1개는 건지는 추천이 됩니다.",
      range: "보통 0.10~0.50",
    },
    {
      key: "coverage",
      title: "Coverage",
      value: normalizedMetrics.coverage,
      display: fmtPct(normalizedMetrics.coverage),
      desc:
        "추천 결과가 특정 인기 레시피에만 몰리지 않고 다양한 레시피를 보여주는 정도.\n높을수록 다양성(탐색)이 좋아요.",
      range: "보통 0.10~0.50",
    },
  ];

  return (
    <div className="adminWrap">
      <header className="adminHeader">
        <div className="adminTitle">
          <div className="adminTitleTop">관리자</div>
          <div className="adminSubtitle">
            추천 유사도 모델 학습(BPR) 및 추천 품질 지표(Recall/NDCG/Hit/Coverage) 관리
          </div>
        </div>

        <div className="adminHeaderActions">
          <button className="btn ghost" onClick={() => setShowDebug((v) => !v)} type="button">
            {showDebug ? "디버그 숨기기" : "디버그 보기"}
          </button>
          <button className="btn" onClick={onBack} type="button">
            메인으로
          </button>
        </div>
      </header>

      <main className="adminGrid">
        {err && <div className="adminErr">{err}</div>}

        {/* 학습 패널 */}
        <section className="panel">
          <div className="panelHead">
            <div>
              <div className="panelTitle">모델 학습</div>
              <div className="panelHint">사용자-레시피 선호를 반영하는 BPR 학습을 실행합니다.</div>
            </div>
            <div className="panelActions">
              <span className={trainBadge.cls}>{trainBadge.text}</span>
              <button
                className="btn primary"
                onClick={startTrain}
                disabled={busyTrainStart || trainState.running}
                type="button"
              >
                {trainState.running || busyTrainStart ? "진행 중..." : "학습 시작"}
              </button>
              <button className="btn" onClick={() => loadTrainStatus()} disabled={loadingTrain} type="button">
                새로고침
              </button>
            </div>
          </div>

          <div className="panelBody">
            <div className="kvRow">
              <div className="kv">
                <div className="k">상태</div>
                <div className="v">{trainBadge.text}</div>
              </div>
              <div className="kv">
                <div className="k">마지막 시작</div>
                <div className="v mono">{safeStr(trainState.lastStartedAt)}</div>
              </div>
              <div className="kv">
                <div className="k">마지막 종료</div>
                <div className="v mono">{safeStr(trainState.lastFinishedAt)}</div>
              </div>
            </div>

            {trainState.lastError && (
              <div className="warnBox">
                <div className="warnTitle">최근 오류</div>
                <pre className="pre">{String(trainState.lastError)}</pre>
              </div>
            )}

            {showDebug && (
              <div className="debugBox">
                <div className="debugTitle">Raw (학습 상태 응답)</div>
                <pre className="pre">{JSON.stringify(train, null, 2)}</pre>
              </div>
            )}
          </div>
        </section>

        {/* 지표 패널 */}
        <section className="panel">
          <div className="panelHead">
            <div>
              <div className="panelTitle">추천 품질 지표</div>
              <div className="panelHint">
                “추천이 잘 맞는지(개인화)”와 “다양한지(탐색)”를 숫자로 확인합니다.
              </div>
            </div>
            <div className="panelActions">
              <button
                className="btn primary"
                onClick={recomputeMetrics}
                disabled={busyRecompute}
                type="button"
              >
                {busyRecompute ? "계산 중..." : "지표 재계산"}
              </button>
              <button className="btn" onClick={() => loadMetrics()} disabled={loadingMetrics} type="button">
                새로고침
              </button>
            </div>
          </div>

          <div className="panelBody">
            <div className="metricGrid">
              {metricItems.map((it) => {
                const g = gradeMetric(it.key === "coverage" ? "coverage" : "rank", it.value);
                return (
                  <div className="metricCard" key={it.key}>
                    <div className="metricTop">
                      <div className="metricName">{it.title}</div>
                      <span className={`badge ${g.cls}`}>{g.label}</span>
                    </div>
                    <div className="metricValue">{it.display}</div>
                    <div className="metricDesc">{it.desc}</div>
                    <div className="metricRange">참고 범위: {it.range}</div>
                  </div>
                );
              })}
            </div>

            <div className="metaRow">
              <div className="meta">
                <div className="k">지표 생성 시각</div>
                <div className="v mono">{safeStr(normalizedMetrics.createdAt)}</div>
              </div>
              <div className="meta">
                <div className="k">팁</div>
                <div className="v">
                  <b>Recall/NDCG/Hit</b>가 오르면 “개인화”가 좋아지고, <b>Coverage</b>가 오르면 “다양성”이 좋아집니다.
                </div>
              </div>
            </div>

            {showDebug && (
              <div className="debugBox">
                <div className="debugTitle">Raw (지표 응답)</div>
                <pre className="pre">{JSON.stringify(metrics, null, 2)}</pre>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
