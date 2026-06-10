// role은 UI 표시(메뉴 노출) 목적으로만 사용한다.
// 실제 관리자 API(/admin/**)는 백엔드가 JWT 서명으로 최종 검증한다.
// 프론트 role을 조작해도 백엔드에서 403을 반환하므로 보안상 안전하다.

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const getRole = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
};

export const isLoggedIn = (): boolean => !!getToken();

export const isAdmin = (): boolean => getRole() === "ROLE_ADMIN";

export const logout = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("accessTokenExpiresIn");
  localStorage.removeItem("refreshTokenExpiresIn");
  localStorage.removeItem("nickname");
  localStorage.removeItem("role");
};
