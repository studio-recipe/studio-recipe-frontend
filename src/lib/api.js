const ACCESS_TOKEN_KEY = "accessToken";
const BASE_PREFIX = "/studio-recipe"; // 스프링 context-path

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  clearTokens();
}

export function saveTokens(tokenResponse) {
  const t =
    (tokenResponse && (tokenResponse.accessToken || tokenResponse.token)) ||
    (typeof tokenResponse === "string" ? tokenResponse : null);

  if (!t) throw new Error("토큰 응답 형식이 올바르지 않습니다.");
  setAccessToken(t);
}

/**
 * 내부 공통 fetch
 * - JSON/텍스트/204 모두 안전
 * - 401이면 자동 로그아웃 이벤트 발생
 */
async function request(path, options = {}, { withAuth, usePrefix = true } = { withAuth: true, usePrefix: true }) {
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;

  let body = options.body;
  const isPlainObject =
    body && typeof body === "object" && !Array.isArray(body) && !(body instanceof FormData);

  if (isPlainObject) body = JSON.stringify(body);

  if (!headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (withAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // /studio-recipe prefix
  const url = usePrefix ? `${BASE_PREFIX}${path}` : path;

  const res = await fetch(url, {
    ...options,
    body,
    headers,
  });

  // 401 처리: 토큰 삭제 + 전역 이벤트 (App에서 잡아서 로그인으로 보냄)
  if (res.status === 401) {
    clearTokens();
    window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "expired" } }));
    throw new Error("로그인이 만료되었습니다. 다시 로그인 해주세요.");
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  let data = null;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (isJson && data && typeof data === "object") {
      const msg = data.message || data.error || JSON.stringify(data);
      throw new Error(msg);
    }
    throw new Error(typeof data === "string" && data ? data : `HTTP ${res.status}`);
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  return request(path, options, { withAuth: true, usePrefix: true });
}

export async function springApiFetch(path, options = {}) {
  // Spring Boot API calls - vite proxy already handles /studio-recipe routing
  return request(path, options, { withAuth: true, usePrefix: false });
}

export async function publicFetch(path, options = {}) {
  // Flask API calls (like /api/recommend) don't need Spring prefix
  const isFlaskCall = path.startsWith('/api/');
  return request(path, options, { withAuth: false, usePrefix: !isFlaskCall });
}