"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { isAdmin, logout } from "@/utils/auth";
import { apiFetch } from "@/lib/api";
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Bug,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Metrics {
  recallAt10: number;
  ndcgAt10: number;
  hitRateAt10: number;
  coverage: number;
  createdAt?: string;
}

interface TrainingState {
  running: boolean;
  lastSuccess: boolean | null;
  lastError: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
}

const METRIC_DEFS = [
  {
    key: "recallAt10" as keyof Metrics,
    label: "Recall@10",
    desc: "추천 10개 안에 정답이 얼마나 포함되는지",
    range: "참고 범위: 보통 0.05 ~ 0.20",
    threshold: 0.10,
  },
  {
    key: "ndcgAt10" as keyof Metrics,
    label: "NDCG@10",
    desc: "좋은 아이템이 앞쪽에 배치될수록 점수가 높음",
    range: "참고 범위: 보통 0.05 ~ 0.25",
    threshold: 0.10,
  },
  {
    key: "hitRateAt10" as keyof Metrics,
    label: "HitRate@10",
    desc: "추천 10개 중 정답이 1개라도 있으면 HIT",
    range: "참고 범위: 보통 0.10 ~ 0.50",
    threshold: 0.20,
  },
  {
    key: "coverage" as keyof Metrics,
    label: "Coverage",
    desc: "추천 결과가 다양한 레시피를 보여주는 정도",
    range: "참고 범위: 보통 0.10 ~ 0.50",
    threshold: 0.20,
  },
];

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [metricsRefreshing, setMetricsRefreshing] = useState(false);

  const [trainingState, setTrainingState] = useState<TrainingState | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(true);
  const [startingTraining, setStartingTraining] = useState(false);
  const [trainingRefreshing, setTrainingRefreshing] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 접근 제어
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }
    if (role !== "ROLE_ADMIN") {
      toast({ title: "접근 권한이 없습니다.", variant: "destructive" });
      router.push("/");
      return;
    }
    setAuthorized(true);
  }, [router]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiFetch("/studio-recipe/admin/metrics");
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch {
      toast({
        title: "오류",
        description: "지표를 불러오는 데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchTrainingStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/studio-recipe/admin/train-bpr/status");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setTrainingState(data.state);
      }
    } catch {
      // 상태 폴링 실패는 조용히 무시
    } finally {
      setTrainingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    fetchMetrics();
    fetchTrainingStatus();
  }, [authorized, fetchMetrics, fetchTrainingStatus]);

  // 학습 중일 때 3초마다 상태 폴링
  useEffect(() => {
    if (trainingState?.running) {
      pollingRef.current = setInterval(fetchTrainingStatus, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [trainingState?.running, fetchTrainingStatus]);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await apiFetch("/studio-recipe/admin/metrics/recompute", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.saved) {
          setMetrics(data.saved);
          toast({
            title: "지표 재계산 완료",
            description: `소요 시간: ${data.tookMs}ms`,
          });
        } else {
          toast({
            title: "오류",
            description: data.message || "Flask 서버 연결 실패",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "오류", description: "Flask 서버 연결 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "Flask 서버 연결 실패", variant: "destructive" });
    } finally {
      setRecomputing(false);
    }
  };

  const handleStartTraining = async () => {
    setStartingTraining(true);
    try {
      const res = await apiFetch("/studio-recipe/admin/train-bpr", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.state) {
          setTrainingState(data.state);
          toast({
            title: "학습 시작",
            description: data.message || "BPR 모델 학습이 시작되었습니다.",
          });
        } else {
          toast({ title: "오류", description: data.message || "학습 시작에 실패했습니다.", variant: "destructive" });
        }
      } else {
        toast({ title: "오류", description: "학습 시작에 실패했습니다.", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "학습 시작에 실패했습니다.", variant: "destructive" });
    } finally {
      setStartingTraining(false);
    }
  };

  const handleMetricsRefresh = async () => {
    setMetricsRefreshing(true);
    await fetchMetrics();
    setMetricsRefreshing(false);
  };

  const handleTrainingRefresh = async () => {
    setTrainingRefreshing(true);
    await fetchTrainingStatus();
    setTrainingRefreshing(false);
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      // "2026-05-08 08:53:55" 형식 처리 (공백 → T 치환)
      const normalized = dateStr.replace(" ", "T");
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("ko-KR");
    } catch {
      return dateStr;
    }
  };

  const getTrainingStatus = () => {
    if (!trainingState) return { label: "-", color: "text-muted-foreground", icon: <Clock className="size-4" /> };
    if (trainingState.running)
      return { label: "학습 중", color: "text-yellow-400", icon: <Loader2 className="size-4 animate-spin" /> };
    if (trainingState.lastSuccess === true)
      return { label: "학습 완료", color: "text-green-400", icon: <CheckCircle2 className="size-4" /> };
    if (trainingState.lastSuccess === false)
      return { label: "학습 실패", color: "text-red-400", icon: <XCircle className="size-4" /> };
    return { label: "학습 대기", color: "text-muted-foreground", icon: <Clock className="size-4" /> };
  };

  if (!authorized) return null;

  const status = getTrainingStatus();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* 페이지 헤더 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">관리자</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              추천 유사도 모델 학습(BPR) 및 추천 품질 지표(Recall/NDCG/Hit/Coverage) 관리
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug((v) => !v)}
              className="gap-2"
            >
              <Bug className="size-4" />
              디버그 보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/main")}
              className="gap-2"
            >
              <Home className="size-4" />
              메인으로
            </Button>
          </div>
        </div>

        {/* 디버그 패널 */}
        {showDebug && (
          <div className="mb-6 rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">디버그 정보</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Metrics</p>
                <pre className="max-h-48 overflow-auto rounded bg-muted/40 p-2 text-xs text-foreground">
                  {JSON.stringify(metrics, null, 2)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Training State</p>
                <pre className="max-h-48 overflow-auto rounded bg-muted/40 p-2 text-xs text-foreground">
                  {JSON.stringify(trainingState, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 2분할 카드 레이아웃 */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* 좌측: 모델 학습 */}
          <Card>
            <CardHeader>
              <CardTitle>모델 학습</CardTitle>
              <CardDescription>
                사용자-레시피 선호를 반영하는 BPR 학습을 실행합니다.
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="gap-1.5 cursor-default opacity-60"
                >
                  <Clock className="size-3.5" />
                  학습 대기
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartTraining}
                  disabled={startingTraining || trainingState?.running}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {startingTraining
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Play className="size-3.5" />}
                  학습 시작
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTrainingRefresh}
                  disabled={trainingRefreshing}
                  className="gap-1.5"
                >
                  <RefreshCw className={`size-3.5 ${trainingRefreshing ? "animate-spin" : ""}`} />
                  새로고침
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {trainingLoading ? (
                <div className="flex h-36 items-center justify-center">
                  <Spinner className="size-6" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 상태 */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">상태</span>
                    <div className={`flex items-center gap-2 text-sm font-medium ${status.color}`}>
                      {status.icon}
                      <span>{status.label}</span>
                      {trainingState?.running && (
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-yellow-500" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 마지막 시작 */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">마지막 시작</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDateTime(trainingState?.lastStartedAt ?? "")}
                    </span>
                  </div>

                  {/* 마지막 종료 */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">마지막 종료</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDateTime(trainingState?.lastFinishedAt ?? "")}
                    </span>
                  </div>

                  {/* 에러 메시지 */}
                  {trainingState?.lastError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                      <p className="text-sm text-red-400">{trainingState.lastError}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 우측: 추천 품질 지표 */}
          <Card>
            <CardHeader>
              <CardTitle>추천 품질 지표</CardTitle>
              <CardDescription>
                추천이 잘 맞는지(개인화)와 다양한지(탐색)를 숫자로 확인합니다.
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleRecompute}
                  disabled={recomputing}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {recomputing
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <RefreshCw className="size-3.5" />}
                  지표 재계산
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMetricsRefresh}
                  disabled={metricsRefreshing}
                  className="gap-1.5"
                >
                  <RefreshCw className={`size-3.5 ${metricsRefreshing ? "animate-spin" : ""}`} />
                  새로고침
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {metricsLoading ? (
                <div className="flex h-36 items-center justify-center">
                  <Spinner className="size-6" />
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics?.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      지표 생성 시각: {formatDateTime(metrics.createdAt)}
                    </p>
                  )}

                  {/* 2×2 지표 카드 그리드 */}
                  <div className="grid grid-cols-2 gap-3">
                    {METRIC_DEFS.map((def) => {
                      const value = metrics ? (metrics[def.key] as number) : null;
                      const isHigh = value !== null && value >= def.threshold;
                      return (
                        <div
                          key={def.key}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">
                              {def.label}
                            </span>
                            {value !== null && (
                              <Badge
                                variant={isHigh ? "outline" : "destructive"}
                                className={
                                  isHigh
                                    ? "border-green-500/40 bg-green-500/15 text-green-400"
                                    : ""
                                }
                              >
                                {isHigh ? "높음" : "낮음"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {value !== null ? value.toFixed(4) : "-"}
                          </p>
                          <p className="text-xs leading-snug text-muted-foreground">
                            {def.desc}
                          </p>
                          <p className="text-xs text-muted-foreground/60">{def.range}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* 하단 팁 */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Recall/NDCG/Hit가 오르면 개인화가 좋아지고, Coverage가 오르면 다양성이 좋아집니다.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
