"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Field, FieldGroup, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

interface FormData {
  id: string;
  password: string;
  passwordConfirm: string;
  name: string;
  nickname: string;
  email: string;
  birth: string;
  gender: "M" | "F" | "";
}

interface FormErrors {
  id?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  nickname?: string;
  email?: string;
  birth?: string;
  gender?: string;
  general?: string;
}

interface NicknameCheckResult {
  checked: boolean;
  isAvailable: boolean;
  message: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    id: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
    email: "",
    birth: "",
    gender: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [nicknameCheck, setNicknameCheck] = useState<NicknameCheckResult>({
    checked: false,
    isAvailable: false,
    message: "",
  });

  const validateId = (id: string): string | undefined => {
    if (!id) return "아이디를 입력해주세요.";
    if (id.length < 8 || id.length > 16) {
      return "아이디는 8~16자로 입력해주세요.";
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "비밀번호를 입력해주세요.";
    if (password.length < 8 || password.length > 32) {
      return "비밀번호는 8~32자로 입력해주세요.";
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return "비밀번호는 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.";
    }
    return undefined;
  };

  const validatePasswordConfirm = (
    password: string,
    passwordConfirm: string
  ): string | undefined => {
    if (!passwordConfirm) return "비밀번호 확인을 입력해주세요.";
    if (password !== passwordConfirm) {
      return "비밀번호가 일치하지 않습니다.";
    }
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name) return "이름을 입력해주세요.";
    return undefined;
  };

  const validateNickname = (nickname: string): string | undefined => {
    if (!nickname) return "닉네임을 입력해주세요.";
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "이메일을 입력해주세요.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "올바른 이메일 형식을 입력해주세요.";
    }
    return undefined;
  };

  const validateBirth = (birth: string): string | undefined => {
    if (!birth) return "생년월일을 입력해주세요.";
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birth)) {
      return "생년월일은 yyyy-MM-dd 형식으로 입력해주세요.";
    }
    const birthDate = new Date(birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthDate >= today) {
      return "생년월일은 과거 날짜여야 합니다.";
    }
    return undefined;
  };

  const validateGender = (gender: string): string | undefined => {
    if (!gender) return "성별을 선택해주세요.";
    return undefined;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear the error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Reset nickname check when nickname changes
    if (field === "nickname") {
      setNicknameCheck({ checked: false, isAvailable: false, message: "" });
    }

    // Real-time password confirmation check
    if (field === "passwordConfirm" || field === "password") {
      const password = field === "password" ? value : formData.password;
      const confirm =
        field === "passwordConfirm" ? value : formData.passwordConfirm;
      if (confirm && password !== confirm) {
        setErrors((prev) => ({
          ...prev,
          passwordConfirm: "비밀번호가 일치하지 않습니다.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
      }
    }
  };

  const handleCheckNickname = async () => {
    const nicknameError = validateNickname(formData.nickname);
    if (nicknameError) {
      setErrors((prev) => ({ ...prev, nickname: nicknameError }));
      return;
    }

    setIsCheckingNickname(true);
    try {
      const response = await fetch(
        `/studio-recipe/auth/check-nickname?nickname=${encodeURIComponent(formData.nickname)}`
      );
      const data = await response.json();
      // 백엔드: available=true → 이미 존재(사용 불가), available=false → 사용 가능
      const exists = data.available ?? data.isAvailable ?? true;
      setNicknameCheck({
        checked: true,
        isAvailable: !exists,
        message: data.message,
      });
    } catch {
      setNicknameCheck({
        checked: true,
        isAvailable: false,
        message: "닉네임 확인 중 오류가 발생했습니다.",
      });
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const isFormValid = (): boolean => {
    // Check all fields have values
    if (!formData.id || !formData.password || !formData.passwordConfirm || 
        !formData.name || !formData.nickname || !formData.email || 
        !formData.birth || !formData.gender) {
      return false;
    }
    // Check validations
    if (validateId(formData.id) || validatePassword(formData.password) ||
        validatePasswordConfirm(formData.password, formData.passwordConfirm) ||
        validateEmail(formData.email) || validateBirth(formData.birth)) {
      return false;
    }
    // Check nickname verification
    if (!nicknameCheck.checked || !nicknameCheck.isAvailable) {
      return false;
    }
    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      id: validateId(formData.id),
      password: validatePassword(formData.password),
      passwordConfirm: validatePasswordConfirm(
        formData.password,
        formData.passwordConfirm
      ),
      name: validateName(formData.name),
      nickname: validateNickname(formData.nickname),
      email: validateEmail(formData.email),
      birth: validateBirth(formData.birth),
      gender: validateGender(formData.gender),
    };

    setErrors(newErrors);

    // Check if nickname was verified
    if (!nicknameCheck.checked || !nicknameCheck.isAvailable) {
      setErrors((prev) => ({
        ...prev,
        nickname: "닉네임 중복 확인을 해주세요.",
      }));
      return false;
    }

    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/studio-recipe/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formData.id,
          password: formData.password,
          name: formData.name,
          nickname: formData.nickname,
          email: formData.email,
          birth: formData.birth,
          gender: formData.gender,
        }),
      });

      if (response.status === 201) {
        router.push("/login?message=" + encodeURIComponent("회원가입이 완료되었습니다. 로그인해주세요."));
      } else if (response.status === 409) {
        const data = await response.json();
        // Handle 409 conflict - show inline error for conflicting field
        const message = data.message || "";
        if (message.includes("아이디")) {
          setErrors({ id: "이미 사용 중인 아이디입니다." });
        } else if (message.includes("닉네임")) {
          setErrors({ nickname: "이미 사용 중인 닉네임입니다." });
          setNicknameCheck({ checked: false, isAvailable: false, message: "" });
        } else if (message.includes("이메일")) {
          setErrors({ email: "이미 사용 중인 이메일입니다." });
        } else {
          setErrors({ general: message || "중복된 정보가 있습니다." });
        }
      } else {
        const data = await response.json();
        setErrors({ general: data.message || "회원가입에 실패했습니다." });
      }
    } catch {
      setErrors({ general: "서버와의 통신 중 오류가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      <FieldGroup>
        {/* 아이디 */}
        <Field>
          <Label htmlFor="id">아이디</Label>
          <Input
            id="id"
            type="text"
            placeholder="8~16자 입력"
            value={formData.id}
            onChange={(e) => handleInputChange("id", e.target.value)}
            aria-invalid={!!errors.id}
          />
          {errors.id && <FieldError>{errors.id}</FieldError>}
        </Field>

        {/* 비밀번호 */}
        <Field>
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="대문자, 소문자, 숫자, 특수문자 포함 8~32자"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              aria-invalid={!!errors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <FieldError>{errors.password}</FieldError>}
        </Field>

        {/* 비밀번호 확인 */}
        <Field>
          <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
          <div className="relative">
            <Input
              id="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              placeholder="비밀번호를 다시 입력해주세요"
              value={formData.passwordConfirm}
              onChange={(e) =>
                handleInputChange("passwordConfirm", e.target.value)
              }
              aria-invalid={!!errors.passwordConfirm}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPasswordConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.passwordConfirm && (
            <FieldError>{errors.passwordConfirm}</FieldError>
          )}
        </Field>

        {/* 이름 */}
        <Field>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            placeholder="이름을 입력해주세요"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        {/* 닉네임 */}
        <Field>
          <Label htmlFor="nickname">닉네임</Label>
          <div className="flex gap-2">
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={formData.nickname}
              onChange={(e) => handleInputChange("nickname", e.target.value)}
              aria-invalid={!!errors.nickname}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckNickname}
              disabled={isCheckingNickname || !formData.nickname}
              className="shrink-0 border-primary/50 hover:bg-primary/10"
            >
              {isCheckingNickname ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "중복 확인"
              )}
            </Button>
          </div>
          {nicknameCheck.checked && (
            <div
              className={`flex items-center gap-1.5 text-sm ${nicknameCheck.isAvailable ? "text-green-500" : "text-destructive"}`}
            >
              {nicknameCheck.isAvailable ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {nicknameCheck.message}
            </div>
          )}
          {errors.nickname && !nicknameCheck.checked && (
            <FieldError>{errors.nickname}</FieldError>
          )}
        </Field>

        {/* 이메일 */}
        <Field>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        {/* 생년월일 */}
        <Field>
          <Label htmlFor="birth">생년월일</Label>
          <Input
            id="birth"
            type="date"
            placeholder="yyyy-MM-dd"
            value={formData.birth}
            onChange={(e) => handleInputChange("birth", e.target.value)}
            aria-invalid={!!errors.birth}
          />
          {errors.birth && <FieldError>{errors.birth}</FieldError>}
        </Field>

        {/* 성별 */}
        <Field>
          <Label>성별</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.gender === "M" ? "default" : "outline"}
              onClick={() => handleInputChange("gender", "M")}
              className={`flex-1 ${formData.gender === "M" ? "bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              남성
            </Button>
            <Button
              type="button"
              variant={formData.gender === "F" ? "default" : "outline"}
              onClick={() => handleInputChange("gender", "F")}
              className={`flex-1 ${formData.gender === "F" ? "bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              여성
            </Button>
          </div>
          {errors.gender && <FieldError>{errors.gender}</FieldError>}
        </Field>

        {/* 일반 에러 메시지 */}
        {errors.general && (
          <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
            {errors.general}
          </div>
        )}

        {/* 제출 버튼 */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          size="lg"
        >
          {isSubmitting ? <Spinner className="mr-2" /> : null}
          {isSubmitting ? "가입 중..." : "회원가입"}
        </Button>
      </FieldGroup>
    </form>
  );
}
