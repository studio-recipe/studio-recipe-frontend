"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/header";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ChefHat, ImagePlus, X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface RecipeForm {
  rcpTtl: string;
  ckgNm: string;
  ckgMthActoNm: string;
  ckgMtrlActoNm: string;
  ckgKndActoNm: string;
  ckgMtrlCn: string;
  ckgInbunNm: string;
  ckgDodfNm: string;
  ckgTimeNm: string;
}

interface FormErrors {
  rcpTtl?: string;
  ckgNm?: string;
  ckgMtrlCn?: string;
  image?: string;
  general?: string;
}

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const rcpSno = params.rcpSno as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  // 기존 이미지 URL (서버에서 불러옴)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  // 새로 선택한 파일
  const [imageFile, setImageFile] = useState<File | null>(null);
  // 미리보기용 URL (새 파일이면 object URL, 없으면 기존 URL)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeForm>({
    rcpTtl: "",
    ckgNm: "",
    ckgMthActoNm: "",
    ckgMtrlActoNm: "",
    ckgKndActoNm: "",
    ckgMtrlCn: "",
    ckgInbunNm: "",
    ckgDodfNm: "",
    ckgTimeNm: "",
  });

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
      return;
    }

    const fetchRecipe = async () => {
      try {
        const res = await fetch(`/studio-recipe/recipes/${rcpSno}`);
        if (res.ok) {
          const data = await res.json();
          setForm({
            rcpTtl: data.rcpTtl || "",
            ckgNm: data.ckgNm || "",
            ckgMthActoNm: data.ckgMthActoNm || "",
            ckgMtrlActoNm: data.ckgMtrlActoNm || "",
            ckgKndActoNm: data.ckgKndActoNm || "",
            ckgMtrlCn: data.ckgMtrlCn || "",
            ckgInbunNm: data.ckgInbunNm || "",
            ckgDodfNm: data.ckgDodfNm || "",
            ckgTimeNm: data.ckgTimeNm || "",
          });
          if (data.rcpImgUrl) {
            setExistingImageUrl(data.rcpImgUrl);
            setImagePreview(data.rcpImgUrl);
          }
        } else if (res.status === 404) {
          toast({ title: "존재하지 않는 레시피입니다.", variant: "destructive" });
          router.push("/main");
        }
      } catch {
        toast({ title: "레시피를 불러오는 데 실패했습니다.", variant: "destructive" });
        router.push("/main");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecipe();
  }, [rcpSno, router]);

  const setField = (field: keyof RecipeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const handleImageChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "이미지 파일만 업로드 가능합니다." }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, image: "파일 크기는 5MB 이하여야 합니다." }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: undefined }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleImageChange(e.dataTransfer.files?.[0] ?? null);
  };

  const removeImage = () => {
    setImageFile(null);
    setExistingImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.rcpTtl.trim()) newErrors.rcpTtl = "레시피 제목을 입력해주세요.";
    if (!form.ckgNm.trim()) newErrors.ckgNm = "요리명을 입력해주세요.";
    if (!form.ckgMtrlCn.trim()) newErrors.ckgMtrlCn = "재료를 입력해주세요.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(form)], { type: "application/json" })
      );
      // 새 파일이 있을 때만 image 파트 추가 (없으면 서버가 기존 이미지 유지)
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await apiFetch(`/studio-recipe/recipes/${rcpSno}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        toast({ title: "레시피가 수정되었습니다." });
        router.push(`/recipes/${rcpSno}`);
      } else if (res.status === 403) {
        toast({ title: "권한이 없습니다.", variant: "destructive" });
      } else if (res.status === 404) {
        toast({ title: "존재하지 않는 레시피입니다.", variant: "destructive" });
        router.push("/main");
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setErrors({ general: data.message || "필수값이 누락되었거나 파일 형식이 올바르지 않습니다." });
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ general: data.message || "레시피 수정에 실패했습니다." });
      }
    } catch {
      setErrors({ general: "네트워크 오류가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-96 items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">레시피 수정</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <Label htmlFor="rcpTtl">레시피 제목 *</Label>
              <Input
                id="rcpTtl"
                placeholder="레시피 제목을 입력해주세요"
                value={form.rcpTtl}
                onChange={(e) => setField("rcpTtl", e.target.value)}
                aria-invalid={!!errors.rcpTtl}
              />
              {errors.rcpTtl && <FieldError>{errors.rcpTtl}</FieldError>}
            </Field>

            <Field>
              <Label htmlFor="ckgNm">요리명 *</Label>
              <Input
                id="ckgNm"
                placeholder="요리명을 입력해주세요"
                value={form.ckgNm}
                onChange={(e) => setField("ckgNm", e.target.value)}
                aria-invalid={!!errors.ckgNm}
              />
              {errors.ckgNm && <FieldError>{errors.ckgNm}</FieldError>}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <Label htmlFor="ckgInbunNm">인분</Label>
                <Input
                  id="ckgInbunNm"
                  placeholder="예: 2인분"
                  value={form.ckgInbunNm}
                  onChange={(e) => setField("ckgInbunNm", e.target.value)}
                />
              </Field>
              <Field>
                <Label>난이도</Label>
                <Select value={form.ckgDodfNm} onValueChange={(v) => setField("ckgDodfNm", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="초급">초급</SelectItem>
                    <SelectItem value="중급">중급</SelectItem>
                    <SelectItem value="고급">고급</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="ckgTimeNm">조리시간</Label>
                <Input
                  id="ckgTimeNm"
                  placeholder="예: 30분"
                  value={form.ckgTimeNm}
                  onChange={(e) => setField("ckgTimeNm", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field>
                <Label htmlFor="ckgMthActoNm">조리방법</Label>
                <Input
                  id="ckgMthActoNm"
                  placeholder="예: 볶음"
                  value={form.ckgMthActoNm}
                  onChange={(e) => setField("ckgMthActoNm", e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="ckgMtrlActoNm">재료분류</Label>
                <Input
                  id="ckgMtrlActoNm"
                  placeholder="예: 채소류"
                  value={form.ckgMtrlActoNm}
                  onChange={(e) => setField("ckgMtrlActoNm", e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="ckgKndActoNm">음식종류</Label>
                <Input
                  id="ckgKndActoNm"
                  placeholder="예: 한식"
                  value={form.ckgKndActoNm}
                  onChange={(e) => setField("ckgKndActoNm", e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <Label htmlFor="ckgMtrlCn">재료 *</Label>
              <Textarea
                id="ckgMtrlCn"
                placeholder={"재료를 / 로 구분하여 입력해주세요\n예: 돼지고기 200g / 양파 1개 / 간장 2큰술"}
                value={form.ckgMtrlCn}
                onChange={(e) => setField("ckgMtrlCn", e.target.value)}
                className="min-h-24 resize-none"
                aria-invalid={!!errors.ckgMtrlCn}
              />
              {errors.ckgMtrlCn && <FieldError>{errors.ckgMtrlCn}</FieldError>}
            </Field>

            {/* 이미지 업로드 */}
            <Field>
              <Label>
                대표 이미지
                {existingImageUrl && !imageFile && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (새 이미지를 업로드하지 않으면 기존 이미지가 유지됩니다)
                  </span>
                )}
              </Label>
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileInputChange}
              />
              {imagePreview ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                  <Image
                    src={imagePreview}
                    alt="미리보기"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm hover:bg-background"
                    >
                      교체
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm hover:bg-background"
                      aria-label="이미지 제거"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  {imageFile && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-primary/90 px-2 py-0.5 text-xs text-primary-foreground">
                      새 이미지
                    </div>
                  )}
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  {existingImageUrl === null ? (
                    <>
                      <ImagePlus className="size-10 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">클릭하거나 드래그하여 업로드</p>
                        <p className="text-xs text-muted-foreground">이미지 파일 (최대 5MB)</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ChefHat className="size-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">이미지가 삭제되었습니다</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      >
                        이미지 업로드
                      </Button>
                    </>
                  )}
                </div>
              )}
              {errors.image && <FieldError>{errors.image}</FieldError>}
            </Field>
          </FieldGroup>

          {errors.general && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <p className="text-sm text-destructive">{errors.general}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              수정하기
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
