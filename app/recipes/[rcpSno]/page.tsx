"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Heart,
  Clock,
  Users,
  ChefHat,
  Eye,
  Flame,
  UtensilsCrossed,
  Leaf,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecipeResponseDTO } from "@/components/recipe-card";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const rcpSno = params.rcpSno as string;

  const [recipe, setRecipe] = useState<RecipeResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [recommendations, setRecommendations] = useState<RecipeResponseDTO[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, []);

  // Fetch recipe detail
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/studio-recipe/recipes/${rcpSno}`);
        if (response.ok) {
          const data = await response.json();
          setRecipe(data);
          setLikeCount(data.rcmmCnt);
        }
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [rcpSno]);

  // Check login status and fetch initial recommendations
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);

    if (token) {
      fetchRecommendations();
    }
  }, []);

  const fetchRecommendations = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setIsLoadingRecommendations(true);
    try {
      const response = await fetch(
        `/studio-recipe/recommend-recipes?k=10&lambda=0.8&seedRecipeId=${rcpSno}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      } else if (response.status === 401) {
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast({
        title: "로그인이 필요한 서비스입니다",
        variant: "destructive",
      });
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setIsLiking(true);

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const response = await fetch(`/studio-recipe/likes/${rcpSno}`, {
        method: newLiked ? "POST" : "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Fetch updated recommendations
        setIsLoadingRecommendations(true);
        await fetchRecommendations();
        toast({
          title: "추천 레시피가 업데이트되었습니다 ✨",
        });
      } else if (response.status === 401) {
        // Revert optimistic update
        setLiked(!newLiked);
        setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
        toast({
          title: "로그인이 필요한 서비스입니다",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const parseIngredients = (ingredientsStr: string): string[] => {
    if (!ingredientsStr) return [];
    return ingredientsStr
      .split("/")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <ChefHat className="size-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">레시피를 찾을 수 없습니다</p>
        <Button onClick={() => router.push("/main")} variant="outline">
          메인으로 돌아가기
        </Button>
      </div>
    );
  }

  const ingredients = parseIngredients(recipe.ckgMtrlCn);

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/main")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            메인으로
          </Button>
        </div>
      </div>

      {/* Hero image */}
      <div className="relative aspect-video w-full overflow-hidden md:aspect-[21/9]">
        {recipe.rcpImgUrl ? (
          <Image
            src={recipe.rcpImgUrl}
            alt={recipe.rcpTtl}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <ChefHat className="size-24 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Title and category */}
        <div className="-mt-16 relative z-10">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
              {recipe.ckgNm || "기타"}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl text-balance">
            {recipe.rcpTtl}
          </h1>
        </div>

        {/* Info row */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {recipe.ckgInbunNm && (
            <div className="flex items-center gap-1.5">
              <Users className="size-4" />
              <span>{recipe.ckgInbunNm}</span>
            </div>
          )}
          {recipe.ckgDodfNm && (
            <div className="flex items-center gap-1.5">
              <Flame className="size-4" />
              <span>{recipe.ckgDodfNm}</span>
            </div>
          )}
          {recipe.ckgTimeNm && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <span>{recipe.ckgTimeNm}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Eye className="size-4" />
            <span>{recipe.inqCnt.toLocaleString()} 조회</span>
          </div>
        </div>

        {/* Method badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {recipe.ckgMthActoNm && (
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
              <UtensilsCrossed className="size-3.5" />
              {recipe.ckgMthActoNm}
            </span>
          )}
          {recipe.ckgMtrlActoNm && (
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
              <Leaf className="size-3.5" />
              {recipe.ckgMtrlActoNm}
            </span>
          )}
          {recipe.ckgKndActoNm && (
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
              <ChefHat className="size-3.5" />
              {recipe.ckgKndActoNm}
            </span>
          )}
        </div>

        {/* Like button */}
        <div className="mt-6">
          <Button
            variant={liked ? "default" : "outline"}
            size="lg"
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "gap-2 transition-all",
              liked && "bg-red-500 hover:bg-red-600 border-red-500"
            )}
          >
            <Heart className={cn("size-5", liked && "fill-current")} />
            <span>좋아요</span>
            <span className="ml-1 font-semibold">{likeCount.toLocaleString()}</span>
          </Button>
        </div>

        {/* Ingredients section */}
        {ingredients.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">재료</h2>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations section */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            이 레시피를 좋아하면 이런 레시피도 좋아요
          </h2>

          {!isLoggedIn ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                <ChefHat className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground">추천 레시피를 보려면 로그인하세요</p>
                <Button
                  onClick={() => router.push("/login")}
                  className="gap-2"
                >
                  <LogIn className="size-4" />
                  로그인
                </Button>
              </CardContent>
            </Card>
          ) : isLoadingRecommendations ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-8 text-primary" />
            </div>
          ) : recommendations.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 pb-4">
                {recommendations.map((rec) => (
                  <Card
                    key={rec.rcpSno}
                    className="w-64 flex-shrink-0 cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
                    onClick={() => router.push(`/recipes/${rec.rcpSno}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {rec.rcpImgUrl ? (
                        <Image
                          src={rec.rcpImgUrl}
                          alt={rec.rcpTtl}
                          fill
                          className="object-cover"
                          sizes="256px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <ChefHat className="size-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {rec.ckgNm || "기타"}
                      </span>
                      <h3 className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                        {rec.rcpTtl}
                      </h3>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="size-3" />
                        <span>{rec.rcmmCnt}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
                <ChefHat className="size-12 text-muted-foreground" />
                <p className="text-muted-foreground">추천 레시피가 없습니다</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
