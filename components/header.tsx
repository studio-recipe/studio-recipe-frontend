"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChefHat, Heart, LogIn, LogOut, PlusCircle, Settings, User, UserPlus } from "lucide-react";
import { isAdmin, logout } from "@/utils/auth";

export function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedNickname = localStorage.getItem("nickname");
    setIsLoggedIn(!!token);
    setNickname(storedNickname);
    setAdminUser(isAdmin());
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setNickname(null);
    setAdminUser(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/main" className="flex items-center gap-2">
          <ChefHat className="size-8 text-primary" />
          <span className="text-xl font-bold text-foreground">원룸 레시피</span>
        </Link>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {nickname && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="size-4" />
                <span className="font-medium text-foreground">{nickname}</span>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push("/recipes/new")}
              className="gap-2"
            >
              <PlusCircle className="size-4" />
              <span className="hidden sm:inline">레시피 등록</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/likes")}
              className="gap-2"
            >
              <Heart className="size-4" />
              <span className="hidden sm:inline">좋아요 목록</span>
            </Button>
            {adminUser && (
              <Button
                variant="outline"
                onClick={() => router.push("/admin")}
                className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-400"
              >
                <Settings className="size-4" />
                <span className="hidden sm:inline">관리자</span>
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/register")}
              className="gap-2"
            >
              <UserPlus className="size-4" />
              회원가입
            </Button>
            <Button
              variant="default"
              onClick={() => router.push("/login")}
              className="gap-2"
            >
              <LogIn className="size-4" />
              로그인
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
