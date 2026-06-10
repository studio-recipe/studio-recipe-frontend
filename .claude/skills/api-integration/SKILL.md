---
description: Studio Recipe Spring 백엔드 호출 규칙. fetch, 데이터 로딩, 인증 요청을 추가/수정할 때 사용.
---

## 규칙
- 모든 백엔드 경로는 `/studio-recipe`로 시작 (Next.js rewrites 프록시)
- 인증 필요 요청: 반드시 `lib/api.ts`의 `apiFetch` 사용
  - apiFetch가 토큰 주입, 401 시 토큰 정리 + /login 리다이렉트를 중앙 처리
  - 직접 `fetch` + 수동 `Authorization: Bearer` 작성 금지 (recipe-card.tsx가 이 패턴이라 apiFetch로 통일 필요)
- 공개 요청(목록/상세 등 비인증): 일반 `fetch` 허용
- 에러는 `toast`로 표시
- accessToken은 localStorage "accessToken" 키, 클라이언트 컴포넌트에서만 접근