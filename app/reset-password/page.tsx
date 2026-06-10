"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ChefHat, CheckCircle2, Eye, EyeOff } from "lucide-react";

type Step = "email" | "verify" | "password" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8 || pw.length > 32) return "비밀번호는 8~32자로 입력해주세요.";
    if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) {
      return "비밀번호는 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.";
    }
    return null;
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/studio-recipe/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep("verify");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "인증 코드 발송에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/studio-recipe/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: code, purpose: "RESET_PASSWORD" }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token || data.verificationToken || "");
        setStep("password");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "인증 코드가 올바르지 않습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(newPassword);
    if (pwError) { setPasswordError(pwError); return; }
    if (newPassword !== passwordConfirm) { setPasswordError("비밀번호가 일치하지 않습니다."); return; }

    setIsLoading(true);
    setError(null);
    setPasswordError(null);
    try {
      const res = await fetch("/studio-recipe/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "비밀번호 재설정에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <ChefHat className="size-10 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-foreground mb-2">비밀번호 재설정</h1>
            {step === "email" && (
              <p className="text-muted-foreground text-sm">가입 시 등록한 이메일로 인증 코드를 보내드립니다</p>
            )}
            {step === "verify" && (
              <p className="text-muted-foreground text-sm">
                <span className="text-primary">{email}</span>로 발송된 인증 코드를 입력해주세요
              </p>
            )}
            {step === "password" && (
              <p className="text-muted-foreground text-sm">새로운 비밀번호를 입력해주세요</p>
            )}
          </div>

          {step === "email" && (
            <form onSubmit={handleSendVerification} className="space-y-6">
              <FieldGroup>
                <Field>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="가입 시 등록한 이메일"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    required
                  />
                </Field>
              </FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={!email || isLoading}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                인증 코드 발송
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  로그인으로 돌아가기
                </Link>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <FieldGroup>
                <Field>
                  <Label htmlFor="code">인증 코드</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="이메일로 받은 인증 코드 입력"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(null); }}
                    required
                  />
                </Field>
              </FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={!code || isLoading}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                확인
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setStep("email"); setError(null); setCode(""); }}
              >
                이메일 다시 입력
              </Button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <FieldGroup>
                <Field>
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="대문자, 소문자, 숫자, 특수문자 포함 8~32자"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Field>
                <Field>
                  <Label htmlFor="passwordConfirm">새 비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="비밀번호를 다시 입력해주세요"
                      value={passwordConfirm}
                      onChange={(e) => { setPasswordConfirm(e.target.value); setPasswordError(null); }}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordError && <FieldError>{passwordError}</FieldError>}
                </Field>
              </FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={!newPassword || !passwordConfirm || isLoading}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                비밀번호 재설정
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="size-12 text-green-500" />
                <p className="text-foreground font-semibold">비밀번호가 변경되었습니다</p>
                <p className="text-muted-foreground text-sm">새 비밀번호로 로그인해주세요</p>
              </div>
              <Button className="w-full" onClick={() => router.push("/login")}>
                로그인
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
