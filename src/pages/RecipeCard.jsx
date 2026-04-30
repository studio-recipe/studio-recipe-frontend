import "./recipeCard.css";

export default function RecipeCard({ recipe, onOpenDetail, onToggleLike }) {
  const id = recipe?.rcpSno ?? recipe?.id;
  const title = recipe?.rcpTtl ?? recipe?.name ?? "제목 없음";
  const menuName = recipe?.ckgNm ?? recipe?.menu_name ?? "";
  const imageUrl = recipe?.rcpImgUrl ?? recipe?.img ?? "";
  const liked = recipe?.liked;
  const likeCount = recipe?.rcmmCnt ?? 0;

  function open() {
    onOpenDetail?.(id);
  }

  function onLikeClick(e) {
    // 메인에서 좋아요 눌렀을 때 detail 열리거나 스크롤 튀는 원인 차단
    e.preventDefault();
    e.stopPropagation();
    onToggleLike?.(id, Boolean(liked));
  }

  return (
    <article className="card" onClick={open} role="button" tabIndex={0}>
      <div className="cardMedia">
        {imageUrl ? <img src={imageUrl} alt={title} loading="lazy" /> : <div className="mediaFallback" />}
      </div>

      <div className="cardBody">
        <div className="cardTitle">{title}</div>
        <div className="cardSub">{menuName}</div>

        <div className="cardBottom">
          <button
            type="button"             
            className={`likePill ${liked ? "active" : ""}`}
            onClick={onLikeClick}
            aria-pressed={Boolean(liked)}
          >
            <span className="heart">{liked ? "♥" : "♡"}</span>
            <span className="cnt">{Number(likeCount)}</span>
          </button>

          <button
            type="button"
            className="starBtn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // 스크랩이 있으면 여기서 처리
            }}
            aria-label="스크랩"
          >
            ☆
          </button>
        </div>
      </div>
    </article>
  );
}