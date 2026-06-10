"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ChefHat, CheckCircle2 } from "lucide-react";

type Step = "email" | "verify" | "result";

export default function FindIdPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [foundId, setFoundId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const verifyRes = await fetch("/studio-recipe/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: code, purpose: "FIND_ID" }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        setError(data.message || "인증 코드가 올바르지 않습니다.");
        return;
      }
      const verifyData = await verifyRes.json();
      const token = verifyData.token || verifyData.verificationToken || "";

      const findRes = await fetch("/studio-recipe/auth/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (findRes.ok) {
        const findData = await findRes.json();
        setFoundId(findData.id || findData.userId || findData.username || "");
        setStep("result");
      } else {
        setError("아이디를 찾을 수 없습니다.");
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
            <h1 className="text-2xl font-bold text-foreground mb-2">아이디 찾기</h1>
            {step === "email" && (
              <p className="text-muted-foreground text-sm">
                가입 시 등록한 이메일로 인증 코드를 보내드립니다
              </p>
            )}
            {step === "verify" && (
              <p className="text-muted-foreground text-sm">
                <span className="text-primary">{email}</span>로 발송된 인증 코드를 입력해주세요
              </p>
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

          {step === "result" && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="size-12 text-green-500" />
                <p className="text-muted-foreground text-sm">찾은 아이디</p>
                <div className="rounded-lg bg-muted/30 border border-border px-6 py-4 w-full">
                  <p className="text-xl font-bold text-foreground">{foundId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/reset-password")}
                >
                  비밀번호 재설정
                </Button>
                <Button className="flex-1" onClick={() => router.push("/login")}>
                  로그인
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
