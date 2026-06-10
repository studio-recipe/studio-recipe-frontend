import { logout } from "@/utils/auth";

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
    logout();
    window.location.href = "/login";
  }

  if (response.status === 403) {
    const { toast } = await import("@/hooks/use-toast");
    toast({ title: "접근 권한이 없습니다.", variant: "destructive" });
    window.location.href = "/";
  }

  return response;
}
