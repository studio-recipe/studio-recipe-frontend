import { RegisterForm } from "@/components/register-form";
import { UtensilsCrossed } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 및 타이틀 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/20">
            <UtensilsCrossed className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              원룸 레시피
            </h1>
            <p className="mt-2 text-muted-foreground">
              간편하게 회원가입하고 맞춤 레시피를 추천받아보세요
            </p>
          </div>
        </div>

        {/* 회원가입 카드 */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/20">
          <h2 className="mb-6 text-center text-xl font-semibold text-card-foreground">
            회원가입
          </h2>
          <RegisterForm />
        </div>

        {/* 로그인 링크 */}
        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <a
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            로그인
          </a>
        </p>
      </div>
    </main>
  );
}
