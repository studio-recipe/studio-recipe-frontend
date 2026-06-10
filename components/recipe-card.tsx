"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Users, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export interface RecipeResponseDTO {
  rcpSno: number;
  rcpTtl: string;
  ckgNm: string;
  inqCnt: number;
  rcmmCnt: number;
  ckgMthActoNm: string;
  ckgMtrlActoNm: string;
  ckgKndActoNm: string;
  ckgMtrlCn: string;
  ckgInbunNm: string;
  ckgDodfNm: string;
  ckgTimeNm: string;
  firstRegDt: string;
  rcpImgUrl: string;
}

interface RecipeCardProps {
  recipe: RecipeResponseDTO;
  onLikeToggle?: (rcpSno: number) => void;
  isLiked?: boolean;
}

export function RecipeCard({ recipe, onLikeToggle, isLiked = false }: RecipeCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(recipe.rcmmCnt);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
      return;
    }

    const newLiked = !liked;
    setIsLiking(true);
    try {
      const response = await apiFetch(`/studio-recipe/likes/${recipe.rcpSno}`, {
        method: newLiked ? "POST" : "DELETE",
      });

      if (response.ok) {
        if (newLiked) {
          try {
            const data = await response.json();
            setLiked(typeof data.liked === "boolean" ? data.liked : newLiked);
            setLikeCount(typeof data.likeCount === "number" ? data.likeCount : likeCount + 1);
          } catch {
            setLiked(newLiked);
            setLikeCount((prev) => prev + 1);
          }
        } else {
          setLiked(false);
          setLikeCount((prev) => prev - 1);
        }
        onLikeToggle?.(recipe.rcpSno);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/recipes/${recipe.rcpSno}`);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {recipe.rcpImgUrl ? (
          <Image
            src={recipe.rcpImgUrl}
            alt={recipe.rcpTtl}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <ChefHat className="size-12 text-muted-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 top-2 size-9 rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background",
            liked && "text-red-500 hover:text-red-600"
          )}
          onClick={handleLike}
          disabled={isLiking}
        >
          <Heart className={cn("size-5", liked && "fill-current")} />
          <span className="sr-only">좋아요</span>
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {recipe.ckgNm || "기타"}
          </span>
        </div>
        <h3 className="mb-3 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {recipe.rcpTtl}
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {recipe.ckgInbunNm && (
            <div className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>{recipe.ckgInbunNm}</span>
            </div>
          )}
          {recipe.ckgDodfNm && (
            <div className="flex items-center gap-1">
              <ChefHat className="size-3.5" />
              <span>{recipe.ckgDodfNm}</span>
            </div>
          )}
          {recipe.ckgTimeNm && (
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" />
              <span>{recipe.ckgTimeNm}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Heart className={cn("size-4", liked && "fill-red-500 text-red-500")} />
          <span>{likeCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
