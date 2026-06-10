---
description: 이 앱의 컴포넌트·스타일 규칙. React 컴포넌트나 UI를 만들거나 수정할 때 사용.
---

- shadcn/ui(new-york)를 `@/components/ui`에서 사용. 새 프리미티브는 `npx shadcn@latest add <name>`
- 다크 테마 고정. 색상은 globals.css의 CSS 변수(bg-background, text-foreground, text-primary 등)만 사용
  - 하드코딩 색상(#xxxxxx, text-white) 금지. accent는 오렌지/앰버
- 아이콘은 lucide-react
- 이미지는 next/image (unoptimized: true)
- localStorage/useState/이벤트 등 클라이언트 전용 로직은 "use client" 컴포넌트에서만
- UI 텍스트는 한국어