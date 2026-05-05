export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("accessToken");

  const mergedHeaders: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    mergedHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers: mergedHeaders });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessTokenExpiresIn");
    localStorage.removeItem("refreshTokenExpiresIn");
    localStorage.removeItem("nickname");
    window.location.href = "/login";
  }

  return response;
}
