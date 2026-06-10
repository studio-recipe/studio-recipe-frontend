# 원룸 레시피 프론트엔드

## 개발 명령
- 개발 서버: npm run dev
- 빌드: npm run build
- 린트: npm run lint
- 타입 체크: npx tsc --noEmit

## API 호출 규칙
- 모든 백엔드 경로는 /studio-recipe 프리픽스로 시작 (Next.js rewrites 프록시)
- 인증이 필요한 요청은 반드시 lib/api.ts의 apiFetch 사용 (토큰 주입 + 401 처리 중앙화)
- 직접 fetch + 수동 Authorization 헤더 작성 금지
- 공개 요청(목록/상세 조회)만 일반 fetch 사용
- 에러는 toast로 표시

## API 명세 (MCP)
- 백엔드 OpenAPI 명세는 studio-recipe-api MCP 서버로 연결돼 있다.
- API 호출 코드를 작성/수정하기 전에 이 서버로 엔드포인트·요청/응답 스키마를 먼저 확인한다.
- 필드명·경로를 추측해서 만들지 말고, 명세에 정의된 것만 사용한다.

## 프로젝트 구조
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS v4 + shadcn/ui
- Language: TypeScript
- Package Manager: npm

## 인증
- accessToken은 localStorage에 "accessToken" 키로 저장
- 인증 필요한 요청은 Authorization: Bearer {accessToken} 헤더 포함


## 디자인 원칙
- 다크 테마 고정 (라이트 모드 없음)
- 오렌지/앰버 계열 accent 색상
- 한국어 UI

## 주의사항
- shadcn/ui 컴포넌트 사용
- localStorage는 클라이언트 컴포넌트에서만 접근
- 이미지는 next/image 사용, unoptimized: true 설정됨
- API 호출 실패 시 toast로 에러 표시