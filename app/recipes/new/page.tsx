"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, ImagePlus, X } from "lucide-react";

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

export default function NewRecipePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    }
  }, [router]);

  const setField = (field: keyof RecipeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
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
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await apiFetch("/studio-recipe/recipes", {
        method: "POST",
        body: formData,
      });

      if (res.status === 201 || res.ok) {
        const data = await res.json().catch(() => null);
        toast({ title: "레시피가 등록되었습니다." });
        router.push(data?.rcpSno ? `/recipes/${data.rcpSno}` : "/main");
      } else if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setErrors({ general: data.message || "필수값이 누락되었거나 파일 형식이 올바르지 않습니다." });
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ general: data.message || "레시피 등록에 실패했습니다." });
      }
    } catch {
      setErrors({ general: "네트워크 오류가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">레시피 등록</h1>
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
              <Label>대표 이미지</Label>
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
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground backdrop-blur-sm hover:bg-background"
                    aria-label="이미지 제거"
                  >
                    <X className="size-4" />
                  </button>
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
                  <ImagePlus className="size-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">클릭하거나 드래그하여 업로드</p>
                    <p className="text-xs text-muted-foreground">이미지 파일 (최대 5MB)</p>
                  </div>
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
              등록하기
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
