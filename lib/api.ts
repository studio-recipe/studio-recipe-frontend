import { logout } from "@/utils/auth";

interface ReissueResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  role: string;
}

// 동시에 여러 요청이 401을 받아도 /auth/reissue는 한 번만 호출한다.
let reissuePromise: Promise<void> | null = null;

// RTR: Refresh Token만 보내고(Access Token 불필요), 성공 시 AT/RT를 모두 교체 저장한다.
function reissueTokens(): Promise<void> {
  if (reissuePromise) return reissuePromise;

  reissuePromise = (async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("Refresh Token이 없습니다.");
    }

    const res = await fetch("/studio-recipe/auth/reissue", {
      method: "POST",
      headers: { "Refresh-Token": refreshToken },
    });

    if (!res.ok) {
      throw new Error("Refresh Token이 유효하지 않습니다.");
    }

    const data: ReissueResponse = await res.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("accessTokenExpiresIn", String(data.accessTokenExpiresIn));
    localStorage.setItem("refreshTokenExpiresIn", String(data.refreshTokenExpiresIn));
    if (data.role) localStorage.setItem("role", data.role);
  })().finally(() => {
    reissuePromise = null;
  });

  return reissuePromise;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const token = localStorage.getItem("accessToken");

  const mergedHeaders: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    mergedHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers: mergedHeaders });

  if (response.status === 401) {
    if (!isRetry) {
      try {
        await reissueTokens();
        return apiFetch(url, options, true);
      } catch {
        // Refresh Token도 만료/무효 -> 로그아웃 처리로 진행
      }
    }

    await logout();
    window.location.href = "/login";
    return response;
  }

  if (response.status === 403) {
    const { toast } = await import("@/hooks/use-toast");
    toast({ title: "접근 권한이 없습니다.", variant: "destructive" });
    window.location.href = "/";
  }

  return response;
}
