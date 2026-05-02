# 원룸 레시피 프론트엔드

## 프로젝트 구조
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS v4 + shadcn/ui
- Language: TypeScript
- Package Manager: npm

## API 연결
Spring Boot 백엔드: http://localhost:8080/studio-recipe
- context-path: /studio-recipe
- 모든 API 요청은 Next.js rewrites를 통해 프록시

## 주요 API 엔드포인트
- POST /auth/login → { id, password } → { accessToken, refreshToken }
- POST /auth/register → { id, password, name, nickname, email, birth, gender }
- GET /auth/check-nickname?nickname={value} → { isAvailable, message }
- GET /main-pages?page=0&size=12&direction=desc&sortBy=CREATED_AT → Page<RecipeResponseDTO>
- GET /recommend-recipes?k=10&lambda=0.8 → RecipeResponseDTO[] (인증 필요)
- GET /recipes/{rcpSno} → RecipeResponseDTO
- POST /likes/{rcpSno} → { liked, likeCount } (인증 필요)
- DELETE /likes/{rcpSno} (인증 필요)
- GET /admin/metrics → { recallAt10, ndcgAt10, hitRateAt10, coverage }
- POST /admin/metrics/recompute
- POST /admin/train-bpr
- GET /admin/train-bpr/status

## 인증
- accessToken은 localStorage에 "accessToken" 키로 저장
- 인증 필요한 요청은 Authorization: Bearer {accessToken} 헤더 포함

## RecipeResponseDTO 구조
```typescript
interface RecipeResponseDTO {
  rcpSno: number
  rcpTtl: string      // 레시피 제목
  ckgNm: string       // 요리명
  inqCnt: number      // 조회수
  rcmmCnt: number     // 좋아요수
  ckgMthActoNm: string // 조리방법
  ckgMtrlActoNm: string // 재료분류
  ckgKndActoNm: string  // 음식종류
  ckgMtrlCn: string    // 재료 (/ 구분자)
  ckgInbunNm: string   // 인분
  ckgDodfNm: string    // 난이도
  ckgTimeNm: string    // 조리시간
  firstRegDt: string
  rcpImgUrl: string
}
```

## 페이지 구조
- / → /login 리다이렉트
- /login → 로그인
- /register → 회원가입
- /main → 메인 레시피 페이지
- /recipes/[rcpSno] → 레시피 상세
- /admin → 관리자 대시보드

## 디자인 원칙
- 다크 테마 고정 (라이트 모드 없음)
- 오렌지/앰버 계열 accent 색상
- 한국어 UI

## 주의사항
- shadcn/ui 컴포넌트 사용
- localStorage는 클라이언트 컴포넌트에서만 접근
- 이미지는 next/image 사용, unoptimized: true 설정됨
- API 호출 실패 시 toast로 에러 표시