import { useEffect, useMemo, useState } from "react";
import { apiFetch, publicFetch, getAccessToken } from "../lib/api";
import "./main.css";

/** DTO 필드명이 섞여도 안전하게 읽기 */
function getId(r) {
  return r?.rcpSno ?? r?.recipeId ?? r?.id;
}
function getTitle(r) {
  return r?.rcpTtl ?? r?.title ?? r?.name ?? "제목 없음"; // Flask: name
}
function getImg(r) {
  return r?.rcpImgUrl ?? r?.imgUrl ?? r?.imageUrl ?? r?.img ?? ""; // ✅ Flask: img
}
function getLikeCount(r) {
  const v = r?.rcmmCnt ?? r?.recommendedCount ?? r?.likeCount ?? 0;
  return Number(v) || 0;
}
function getLiked(r) {
  const v = r?.liked ?? r?.isLiked ?? r?.likeYn;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "y" || v.toLowerCase() === "true";
  return false;
}

/** (옵션) 재료 일부를 카드에 칩으로 보여주고 싶을 때 */
function parseIngredientsPreview(text, max = 3) {
  if (!text) return [];
  return text
    .split("/")
    .map((s) => s.replace(/_/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, max);
}

export default function RecipeMainPage({ onGoDetail, onGoAdmin, onLogout, onGoLogin }) {
  // 정렬/페이징
  const sortOptions = useMemo(
    () => [
      { label: "최신순", sortBy: "CREATED_AT", direction: "desc" },
      { label: "등록일 오름차순", sortBy: "CREATED_AT", direction: "asc" },
      { label: "조회순", sortBy: "INQUIRY_COUNT", direction: "desc" },
      { label: "좋아요순", sortBy: "RECOMMENDED_COUNT", direction: "desc" },
    ],
    []
  );

  const [sortIdx, setSortIdx] = useState(0);
  const sort = sortOptions[sortIdx] ?? sortOptions[0];

  const [page, setPage] = useState(0);
  const [size] = useState(12);

  // 데이터
  const [seedRecipeId, setSeedRecipeId] = useState(null);
  const [flaskRecs, setFlaskRecs] = useState([]);
  const [springRecs, setSpringRecs] = useState([]);
  const [allPage, setAllPage] = useState(null);

  // 로딩/에러
  const [loadingFlaskRecs, setLoadingFlaskRecs] = useState(false);
  const [loadingSpringRecs, setLoadingSpringRecs] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [err, setErr] = useState("");

  // 좋아요/스크랩 UI 상태 오버레이
  const [likeState, setLikeState] = useState(() => new Map()); // id -> { liked, likeCount }
  const [scrapState, setScrapState] = useState(() => new Set()); // id set (UI만)

  // ---------------- API loaders ----------------
  async function loadFlaskRecommendations(nextSeedId = null) {
    setLoadingFlaskRecs(true);
    setErr("");
    try {
      const params = new URLSearchParams({ k: "10", lambda: "0.8" });
      if (nextSeedId != null) params.set("seedRecipeId", String(nextSeedId));

      // Flask 추천 서비스 직접 호출 (no auth required)
      const data = await publicFetch(`/api/recommend?${params.toString()}`);

      setFlaskRecs(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setFlaskRecs([]);
      setErr(e?.message || "Flask 추천 로딩 실패");
    } finally {
      setLoadingFlaskRecs(false);
    }
  }

  async function loadSpringRecommendations(nextSeedId = null) {
    // 로그인하지 않은 경우 Spring Boot 추천 호출하지 않음
    const token = getAccessToken();
    if (!token) {
      console.log("Spring Boot 추천: 토큰이 없어 호출하지 않음");
      setSpringRecs([]);
      setLoadingSpringRecs(false);
      return;
    }

    setLoadingSpringRecs(true);
    setErr("");
    try {
      const params = new URLSearchParams({ k: "10", lambda: "0.8" });
      if (nextSeedId != null) params.set("seedRecipeId", String(nextSeedId));

      console.log("Spring Boot 추천 호출:", `/recommend-recipes?${params.toString()}`);
      console.log("사용 토큰:", token ? "있음" : "없음");

      // Spring Boot 추천 서비스 호출 - 올바른 엔드포인트 사용
      const data = await apiFetch(`/recommend-recipes?${params.toString()}`);

      console.log("Spring Boot 추천 응답:", data);
      setSpringRecs(Array.isArray(data) ? data : []);
    } catch (e) {
      setSpringRecs([]);
      console.error("Spring Boot 추천 로딩 실패:", e);
      console.error("에러 상세:", e.message, e.stack);
      setErr(e?.message || "Spring Boot 추천 로딩 실패");
    } finally {
      setLoadingSpringRecs(false);
    }
  }

  async function loadAllRecipes() {
    setLoadingAll(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        direction: sort.direction || "desc",
      });
      const sortBy = (sort.sortBy || "").trim();
      if (sortBy) params.set("sortBy", sortBy);

      const data = await apiFetch(`/main-pages?${params.toString()}`);
      setAllPage(data);
    } catch (e) {
      setAllPage(null);
      setErr(e?.message || "전체 레시피 로딩 실패");
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    // 첫 진입 추천 + 전체
    loadFlaskRecommendations(null);
    loadSpringRecommendations(null);
    loadAllRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAllRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sort.direction, sort.sortBy]);

  // ---------------- handlers ----------------
  function onChangeSort(e) {
    setSortIdx(Number(e.target.value));
    setPage(0);
  }

  function openDetail(recipeId) {
    if (!recipeId) return;
    setSeedRecipeId(recipeId);

    // 화면 흔들림 방지 핵심:
    // - 추천은 "카드 클릭(상세 이동)"에서만 갱신
    loadFlaskRecommendations(recipeId);
    loadSpringRecommendations(recipeId);

    onGoDetail?.(recipeId);
  }

  function refreshRecommend() {
    loadFlaskRecommendations(seedRecipeId ?? null);
    loadSpringRecommendations(seedRecipeId ?? null);
  }

  async function toggleLike(e, recipe) {
    e.preventDefault();
    e.stopPropagation();

    const id = getId(recipe);
    if (!id) return;

    const cur = likeState.get(id);
    const curLiked = cur?.liked ?? getLiked(recipe);
    const curCount = cur?.likeCount ?? getLikeCount(recipe);

    const nextLiked = !curLiked;
    const nextCount = Math.max(0, curCount + (nextLiked ? 1 : -1));

    // optimistic UI
    setLikeState((prev) => {
      const m = new Map(prev);
      m.set(id, { liked: nextLiked, likeCount: nextCount });
      return m;
    });

    try {
      if (nextLiked) {
        // POST (좋아요)
        await apiFetch(`/likes/${id}`, { method: "POST" });
      } else {
        // DELETE (취소)
        await apiFetch(`/likes/${id}`, { method: "DELETE" });
      }

      // 좋아요 누르면 추천을 즉시 바꾸고 싶다면 여기서 seed 기반으로 갱신
      // (단, 흔들림이 싫으면 주석 처리)
      // loadFlaskRecommendations(id);
      // loadSpringRecommendations(id);

    } catch (err) {
      // 백엔드가 "이미 좋아요..." 같은 텍스트를 내려주는 경우 JSON 파싱 에러가 났던 적이 있어
      // api.js는 text도 처리하니 여기까지 오면 "정상 에러"로 message만 나올 것.
      setLikeState((prev) => {
        const m = new Map(prev);
        m.set(id, { liked: curLiked, likeCount: curCount });
        return m;
      });

      const msg = String(err?.message || "");
      // “이미 좋아요”가 오면 UX상: 자동으로 취소로 처리(원하면 유지)
      if (msg.includes("이미 좋아요")) {
        try {
          await apiFetch(`/likes/${id}`, { method: "DELETE" });
          setLikeState((prev) => {
            const m = new Map(prev);
            m.set(id, { liked: false, likeCount: Math.max(0, curCount - 1) });
            return m;
          });
          return;
        } catch {}
      }

      setErr(msg || "좋아요 처리 실패");
    }
  }

  function toggleScrap(e, recipe) {
    e.preventDefault();
    e.stopPropagation();

    const id = getId(recipe);
    if (!id) return;

    // 스크랩 API가 없다면 UI만 토글
    setScrapState((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

    // 나중에 백엔드 생기면 여기서:
    // await apiFetch(`/scraps/${id}`, { method: s.has(id) ? "DELETE" : "POST" });
  }

  const allItems = allPage?.content || [];
  const totalPages = allPage?.totalPages ?? 0;

  // 카드 렌더 (중복 제거)
  function RecipeCard({ r }) {
    const id = getId(r);
    const override = id ? likeState.get(id) : null;
    const liked = override?.liked ?? getLiked(r);
    const likeCount = override?.likeCount ?? getLikeCount(r);
    const scrapped = id ? scrapState.has(id) : false;

    const chips = parseIngredientsPreview(r?.ckgMtrlCn, 3);

    return (
      <div
        className="card"
        role="button"
        tabIndex={0}
        onClick={() => openDetail(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") openDetail(id);
        }}
      >
        <div className="thumb">
          {getImg(r) ? (
            <img src={getImg(r)} alt={getTitle(r)} loading="lazy" />
          ) : (
            <div className="thumbEmpty" />
          )}
        </div>

        <div className="cardBody">
          <div className="cardTitle">{getTitle(r)}</div>

          {/* (옵션) 재료 칩 미리보기 */}
          {chips.length > 0 && (
            <div className="chipRow">
              {chips.map((c, i) => (
                <span className="chip" key={`${id}-chip-${i}`}>
                  {c}
                </span>
              ))}
            </div>
          )}

          <div className="cardActions">
            <button
              className={`iconBtn ${liked ? "active" : ""}`}
              onClick={(e) => toggleLike(e, r)}
              aria-pressed={liked}
              title={liked ? "좋아요 취소" : "좋아요"}
              type="button"
            >
              <span className="icon">{liked ? "♥" : "♡"}</span>
              <span className="count">{likeCount}</span>
            </button>

            <button
              className={`iconBtn ${scrapped ? "active" : ""}`}
              onClick={(e) => toggleScrap(e, r)}
              aria-pressed={scrapped}
              title={scrapped ? "스크랩 취소" : "스크랩"}
              type="button"
            >
              <span className="icon">{scrapped ? "★" : "☆"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mainPage">
      <header className="topHeader">
        <div className="brand">원룸 레시피</div>

        <div className="headerActions">
          {onGoAdmin && (
            <button className="headerBtn" onClick={onGoAdmin} type="button">
              관리자
            </button>
          )}
          {onLogout && (
            <button
              className="headerBtn ghost"
              onClick={() => {
                onLogout?.();
                onGoLogin?.();
              }}
              type="button"
            >
              로그아웃
            </button>
          )}
          <div className="userIcon" aria-label="user">
            👤
          </div>
        </div>
      </header>

      <main className="mainBody">
        {err && <div className="toastErr">{err}</div>}

        {/* Flask 추천 */}
        <section className="section">
          <div className="sectionTitleRow">
            <h2 className="sectionTitle">Flask AI 추천 레시피</h2>
            <button className="miniBtn" onClick={refreshRecommend} disabled={loadingFlaskRecs} type="button">
              새로고침
            </button>
          </div>

          <div className="gridFixed">
            {loadingFlaskRecs
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={`flask-skel-${i}`} />)
              : flaskRecs.map((r) => <RecipeCard key={`flask-${getId(r)}`} r={r} />)}
          </div>
        </section>

        {/* Spring Boot 추천 */}
        <section className="section">
          <div className="sectionTitleRow">
            <h2 className="sectionTitle">Spring Boot 개인화 추천 레시피</h2>
            <button className="miniBtn" onClick={refreshRecommend} disabled={loadingSpringRecs} type="button">
              새로고침
            </button>
          </div>

          <div className="gridFixed">
            {!getAccessToken() ? (
              <div className="loginPrompt">
                <p>개인화 추천을 보려면 로그인이 필요합니다.</p>
                <button className="miniBtn" onClick={() => onGoLogin?.()} type="button">
                  로그인하기
                </button>
              </div>
            ) : loadingSpringRecs ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={`spring-skel-${i}`} />)
            ) : (
              springRecs.map((r) => <RecipeCard key={`spring-${getId(r)}`} r={r} />)
            )}
          </div>
        </section>        

        {/* 전체 */}
        <section className="section">
          <div className="sectionTitleRow">
            <h2 className="sectionTitle">전체 레시피</h2>
            <select className="sortSelect" onChange={onChangeSort} value={sortIdx}>
              {sortOptions.map((o, i) => (
                <option key={o.label} value={i}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="gridFixed">
            {loadingAll
              ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={`all-skel-${i}`} />)
              : allItems.map((r) => <RecipeCard key={getId(r)} r={r} />)}
          </div>

          <div className="pager">
            <button className="pagerBtn" disabled={page <= 0} onClick={() => setPage((p) => p - 1)} type="button">
              이전
            </button>

            <div className="pagerInfo">
              {page + 1} / {Math.max(totalPages, 1)}
            </div>

            <button
              className="pagerBtn"
              disabled={totalPages === 0 || page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              다음
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card skel">
      <div className="thumb skelBox" />
      <div className="cardBody">
        <div className="skelLine" />
        <div className="skelLine short" />
      </div>
    </div>
  );
}