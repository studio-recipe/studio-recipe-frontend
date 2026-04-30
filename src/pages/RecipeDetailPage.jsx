import { useEffect, useState } from "react";
import { apiFetch, getAccessToken } from "../lib/api";
import "./detail.css";

export default function RecipeDetailPage({ recipeId, onBack, onLikedChanged }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liking, setLiking] = useState(false);

  const isAuthenticated = !!getAccessToken();

  useEffect(() => {
    if (!recipeId) return;
    
    loadRecipeDetail();
  }, [recipeId]);

  async function loadRecipeDetail() {
    setLoading(true);
    setError("");
    
    try {
      const data = await apiFetch(`/recipes/${recipeId}`);
      setRecipe(data);
    } catch (err) {
      setError(err.message || "레시피를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike() {
    if (!isAuthenticated) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!recipe || liking) return;
    
    setLiking(true);
    const wasLiked = recipe.liked;
    
    // Optimistic update
    setRecipe(prev => ({
      ...prev,
      liked: !wasLiked,
      rcmmCnt: Math.max(0, (prev.rcmmCnt || 0) + (wasLiked ? -1 : 1))
    }));

    try {
      if (wasLiked) {
        await apiFetch(`/likes/${recipeId}`, { method: "DELETE" });
      } else {
        await apiFetch(`/likes/${recipeId}`, { method: "POST" });
      }
      
      onLikedChanged?.();
    } catch (err) {
      // Revert on error
      setRecipe(prev => ({
        ...prev,
        liked: wasLiked,
        rcmmCnt: Math.max(0, (prev.rcmmCnt || 0) + (wasLiked ? 1 : -1))
      }));
      
      console.error("Like toggle failed:", err);
      if (err.message?.includes("401") || err.message?.includes("로그인")) {
        alert("로그인이 필요합니다.");
      } else {
        alert("좋아요 처리에 실패했습니다.");
      }
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return (
      <div className="detailPage">
        <div className="detailHeader">
          <button className="backBtn" onClick={onBack}>← 뒤로</button>
        </div>
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detailPage">
        <div className="detailHeader">
          <button className="backBtn" onClick={onBack}>← 뒤로</button>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="detailPage">
        <div className="detailHeader">
          <button className="backBtn" onClick={onBack}>← 뒤로</button>
        </div>
        <div className="error">레시피를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="detailPage">
      <div className="detailHeader">
        <button className="backBtn" onClick={onBack}>← 뒤로</button>
        <h1>{recipe.rcpTtl}</h1>
      </div>

      <div className="detailContent">
        {recipe.rcpImgUrl && (
          <div className="detailImage">
            <img src={recipe.rcpImgUrl} alt={recipe.rcpTtl} />
          </div>
        )}

        <div className="detailInfo">
          <div className="detailMeta">
            <span>조회수: {recipe.inqCnt || 0}</span>
            <span>난이도: {recipe.ckgDodfNm || "정보 없음"}</span>
            <span>조리시간: {recipe.ckgTimeNm || "정보 없음"}</span>
            <span>인분: {recipe.ckgInbunNm || "정보 없음"}</span>
          </div>

          <div className="detailActions">
            <button
              className={`likeBtn ${recipe.liked ? "active" : ""}`}
              onClick={toggleLike}
              disabled={liking}
              title={isAuthenticated ? (recipe.liked ? "좋아요 취소" : "좋아요") : "로그인이 필요합니다"}
            >
              <span className="heart">{recipe.liked ? "♥" : "♡"}</span>
              <span className="count">{recipe.rcmmCnt || 0}</span>
            </button>
          </div>

          {recipe.ckgMtrlCn && (
            <div className="detailSection">
              <h3>재료</h3>
              <div className="ingredients">
                {recipe.ckgMtrlCn}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}