"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/header";
import { RecipeCard, RecipeResponseDTO } from "@/components/recipe-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronLeft, ChevronRight, TrendingUp, ThumbsUp } from "lucide-react";
import { apiFetch } from "@/lib/api";

type SortOption = "CREATED_AT" | "INQUIRY_COUNT" | "RECOMMENDED_COUNT";
type SectionType = "ai" | "recommended" | "popular";

interface PageResponse {
  content: RecipeResponseDTO[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export default function MainPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [topRecipes, setTopRecipes] = useState<RecipeResponseDTO[]>([]);
  const [sectionType, setSectionType] = useState<SectionType>("recommended");
  const [topLoading, setTopLoading] = useState(true);
  const [recipes, setRecipes] = useState<RecipeResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("CREATED_AT");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchAllRecipes = useCallback(async (page: number, sort: SortOption) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/studio-recipe/main-pages?page=${page}&size=12&direction=desc&sortBy=${sort}`
      );
      if (response.ok) {
        const data: PageResponse = await response.json();
        setRecipes(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setCurrentPage(data.number);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPopularRecipes = useCallback(async () => {
    try {
      const response = await fetch(
        "/studio-recipe/main-pages?page=0&size=10&direction=desc&sortBy=INQUIRY_COUNT"
      );
      if (response.ok) {
        const data: PageResponse = await response.json();
        setTopRecipes(data.content);
        setSectionType("popular");
      }
    } catch (error) {
      console.error("Failed to fetch popular recipes:", error);
    }
  }, []);

  const fetchRecommendedRecipes = useCallback(async () => {
    try {
      const response = await fetch(
        "/studio-recipe/main-pages?page=0&size=10&direction=desc&sortBy=RECOMMENDED_COUNT"
      );
      if (response.ok) {
        const data: PageResponse = await response.json();
        if (data.content.length > 0) {
          setTopRecipes(data.content);
          setSectionType("recommended");
        } else {
          await fetchPopularRecipes();
        }
      }
    } catch (error) {
      console.error("Failed to fetch recommended recipes:", error);
      await fetchPopularRecipes();
    }
  }, [fetchPopularRecipes]);

  const fetchAiRecommendations = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) return;

    try {
      const response = await apiFetch("/studio-recipe/recommend-recipes?k=10&lambda=0.8");
      if (response.ok) {
        const data: RecipeResponseDTO[] = await response.json();
        if (data.length > 0) {
          setTopRecipes(data);
          setSectionType("ai");
        } else {
          // Flask 미학습 상태: 인기순으로 폴백
          await fetchRecommendedRecipes();
        }
      }
    } catch (error) {
      console.error("Failed to fetch AI recommendations:", error);
      await fetchRecommendedRecipes();
    }
  }, [fetchRecommendedRecipes]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);

    fetchAllRecipes(0, sortBy);

    const loadTopSection = async () => {
      setTopLoading(true);
      if (token) {
        await fetchAiRecommendations();
      } else {
        await fetchRecommendedRecipes();
      }
      setTopLoading(false);
    };
    loadTopSection();
  }, [fetchAllRecipes, fetchAiRecommendations, fetchRecommendedRecipes, sortBy]);

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    fetchAllRecipes(0, value);
  };

  const handlePageChange = (page: number) => {
    fetchAllRecipes(page, sortBy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "CREATED_AT", label: "최신순" },
    { value: "INQUIRY_COUNT", label: "조회수순" },
    { value: "RECOMMENDED_COUNT", label: "좋아요순" },
  ];

  const sectionLabel = {
    ai: { icon: <Sparkles className="size-6 text-primary" />, title: "AI 맞춤 추천", badge: { label: "AI 추천", variant: "default" as const } },
    recommended: { icon: <ThumbsUp className="size-6 text-primary" />, title: "추천 레시피", badge: { label: "추천순", variant: "secondary" as const } },
    popular: { icon: <TrendingUp className="size-6 text-primary" />, title: "인기 레시피", badge: { label: "인기순", variant: "secondary" as const } },
  }[sectionType];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Top Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            {sectionLabel.icon}
            <h2 className="text-2xl font-bold text-foreground">{sectionLabel.title}</h2>
            <Badge variant={sectionLabel.badge.variant}>
              {sectionLabel.badge.label}
            </Badge>
          </div>

          {topLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8 text-primary" />
            </div>
          ) : topRecipes.length > 0 ? (
            <div className="relative">
              <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
                {topRecipes.map((recipe) => (
                  <div key={recipe.rcpSno} className="w-72 shrink-0">
                    <RecipeCard recipe={recipe} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 text-foreground">
              <Sparkles className="size-5 text-primary" />
              <p>로그인하면 AI 맞춤 추천을 받을 수 있어요</p>
            </div>
          )}
        </section>

        {/* All Recipes Section */}
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">전체 레시피</h2>
              <p className="text-sm text-muted-foreground">
                총 {totalElements.toLocaleString()}개의 레시피
              </p>
            </div>
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSortChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Spinner className="size-8 text-primary" />
            </div>
          ) : recipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.rcpSno} recipe={recipe} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="size-4" />
                    <span className="sr-only">이전 페이지</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                          className="size-9"
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="size-4" />
                    <span className="sr-only">다음 페이지</span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">레시피가 없습니다.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
