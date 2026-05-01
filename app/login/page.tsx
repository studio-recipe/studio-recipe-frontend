import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              원룸 레시피
            </h1>
            <p className="text-muted-foreground text-sm">
              간편하게 로그인하고 맞춤 레시피를 만나보세요
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로
          간주됩니다.
        </p>
      </div>
    </main>
  );
}
