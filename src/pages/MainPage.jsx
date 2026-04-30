import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, publicFetch } from "../lib/api";
import RecipeDetailPage from "./RecipeDetailPage";
import RecipeCard from "../components/RecipeCard";
import "./main.css";

export default function MainPage() {
  const [tab, setTab] = useState("home"); // home | all | detail
  const [detailId, setDetailId] = useState(null);

  const [recommended, setRecommended] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingAll, setLoadingAll] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const likingRef = useRef(new Set());

  const recK = 10;
  const recLambda = 0.8;

  async function loadRecommend() {
    try {
      // Flask 추천 서비스 직접 호출 (no auth required)
      const data = await publicFetch(`/api/recommend?k=${recK}&lambda=${recLambda}`);
      setRecommended(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setRecommended([]);
    }
  }

  async function loadAll(nextPage) {
    if (loadingAll) return;
    setLoadingAll(true);
    try {
      const res = await apiFetch(`/main-pages?page=${nextPage}&size=12&direction=desc&sortBy=CREATED_AT`);
      const content = res?.content || [];
      setAllRecipes((prev) => (nextPage === 0 ? content : [...prev, ...content]));
      setHasMore(Boolean(!res?.last));
      setPage(nextPage);
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    loadRecommend();
    loadAll(0);
  }, []);

  function openDetail(id) {
    setDetailId(id);
    setTab("detail");
  }

  function backFromDetail() {
    setTab("home");
    setDetailId(null);
  }

  // 좋아요: optimistic update + 서버 반영
  async function toggleLike(recipeId, currentlyLiked) {
    if (!recipeId) return;
    if (likingRef.current.has(recipeId)) return;
    likingRef.current.add(recipeId);

    const nextLiked = !currentlyLiked;

    const patch = (arr) =>
      arr.map((r) => {
        const id = r.rcpSno || r.id;
        return id === recipeId
          ? {
              ...r,
              liked: nextLiked,
              rcmmCnt: Math.max(0, Number(r.rcmmCnt ?? 0) + (nextLiked ? 1 : -1)),
            }
          : r;
      });

    setRecommended((prev) => patch(prev));
    setAllRecipes((prev) => patch(prev));

    try {
      await apiFetch(`/likes/${recipeId}`, {
        method: nextLiked ? "POST" : "DELETE",
      });

      // 여기서 loadRecommend()를 즉시 호출하지 않음 (깜박임/위로 튐 방지)
      // 필요하면 “새로고침” 버튼으로 갱신하거나, 상세 페이지에서만 갱신.
    } catch {
      // 실패 시: 안전하게 다시 로드(원복)
      await loadRecommend();
      await loadAll(page);
    } finally {
      likingRef.current.delete(recipeId);
    }
  }

  const title = useMemo(() => {
    if (tab === "all") return "전체 레시피";
    if (tab === "detail") return "레시피 상세";
    return "추천 레시피";
  }, [tab]);

  return (
    <div className="mainRoot">
      <header className="mainTop">
        <div className="mainBrand">
          <div className="dot" />
          <div>
            <div className="brandName">원룸 레시피</div>
            <div className="brandSub">오늘 뭐 먹지? 개인 맞춤 추천</div>
          </div>
        </div>

        <div className="tabs">
          <button type="button" className={`tab ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")}>
            추천
          </button>
          <button type="button" className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
            전체
          </button>

          {/* 추천 수동 새로고침 버튼 (깜박임 최소화) */}
          <button type="button" className="tab ghost" onClick={loadRecommend}>
            새로고침
          </button>
        </div>
      </header>

      <div className="sectionTitle">{title}</div>

      {tab === "detail" && detailId != null ? (
        <RecipeDetailPage
          recipeId={detailId}
          onBack={backFromDetail}
          onLikedChanged={() => {
            // 상세에서 좋아요 누르면 추천 갱신(원하면 유지)
            loadRecommend();
          }}
        />
      ) : (
        <>
          {tab === "home" && (
            <section className="grid">
              {recommended.map((r) => (
                <RecipeCard key={r.rcpSno || r.id} recipe={r} onOpenDetail={openDetail} onToggleLike={toggleLike} />
              ))}
              {recommended.length === 0 && <div className="empty">추천 레시피가 없습니다.</div>}
            </section>
          )}

          {tab === "all" && (
            <>
              <section className="grid">
                {allRecipes.map((r) => (
                  <RecipeCard key={r.rcpSno} recipe={r} onOpenDetail={openDetail} onToggleLike={toggleLike} />
                ))}
              </section>

              <div className="loadMoreRow">
                <button
                  type="button"
                  className="loadMoreBtn"
                  disabled={!hasMore || loadingAll}
                  onClick={() => loadAll(page + 1)}
                >
                  {loadingAll ? "불러오는 중..." : hasMore ? "더 보기" : "마지막입니다"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}