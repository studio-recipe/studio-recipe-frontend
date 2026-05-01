"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/studio-recipe/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formData.id,
          password: formData.password,
        }),
      });

      if (response.status === 401) {
        setError("아이디 또는 비밀번호가 일치하지 않습니다");
        return;
      }

      if (!response.ok) {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
        return;
      }

      const data: LoginResponse = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem(
        "accessTokenExpiresIn",
        String(data.accessTokenExpiresIn)
      );
      localStorage.setItem(
        "refreshTokenExpiresIn",
        String(data.refreshTokenExpiresIn)
      );

      router.push("/main");
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.id.trim() !== "" && formData.password !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="rounded-md bg-green-500/10 border border-green-500/30 p-3">
          <p className="text-sm text-green-500">{successMessage}</p>
        </div>
      )}
      <FieldGroup>
        <Field>
          <Label htmlFor="id" className="text-foreground">
            아이디
          </Label>
          <Input
            id="id"
            name="id"
            type="text"
            value={formData.id}
            onChange={handleInputChange}
            placeholder="아이디를 입력하세요"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
            autoComplete="username"
          />
        </Field>

        <Field>
          <Label htmlFor="password" className="text-foreground">
            비밀번호
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="비밀번호를 입력하세요"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
            autoComplete="current-password"
          />
        </Field>
      </FieldGroup>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="h-4 w-4" />
            로그인 중...
          </span>
        ) : (
          "로그인"
        )}
      </Button>

      <div className="flex items-center justify-center gap-4 text-sm">
        <Link
          href="/find-id"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          아이디 찾기
        </Link>
        <span className="text-border">|</span>
        <Link
          href="/reset-password"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          비밀번호 재설정
        </Link>
      </div>

      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          아직 계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            회원가입
          </Link>
        </p>
      </div>
    </form>
  );
}
