"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { RecipeCard, RecipeResponseDTO } from "@/components/recipe-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Heart, ChefHat } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LikesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
      return;
    }

    const fetchLikes = async () => {
      try {
        const res = await apiFetch("/studio-recipe/likes");
        if (res.ok) {
          const data = await res.json();
          // 응답이 배열이거나 Page 객체일 수 있음
          if (Array.isArray(data)) {
            setRecipes(data);
          } else if (data.content && Array.isArray(data.content)) {
            setRecipes(data.content);
          }
        }
      } catch (error) {
        console.error("Failed to fetch likes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLikes();
  }, [router]);

  const handleLikeToggle = (rcpSno: number) => {
    setRecipes((prev) => prev.filter((r) => r.rcpSno !== rcpSno));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Heart className="size-6 text-primary fill-primary" />
          <h1 className="text-2xl font-bold text-foreground">좋아요 목록</h1>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              총 {recipes.length}개
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.rcpSno}
                recipe={recipe}
                isLiked={true}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-24">
            <ChefHat className="size-16 text-muted-foreground" />
            <p className="text-muted-foreground">좋아요한 레시피가 없습니다</p>
            <Button variant="outline" onClick={() => router.push("/main")}>
              레시피 둘러보기
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
