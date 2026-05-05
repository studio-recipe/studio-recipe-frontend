"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Target,
  TrendingUp,
  Layers,
} from "lucide-react";

interface Metrics {
  recallAt10: number;
  ndcgAt10: number;
  hitRateAt10: number;
  coverage: number;
}

interface TrainingState {
  running: boolean;
  last_success: boolean;
  last_error: string;
  last_started_at: string;
  last_finished_at: string;
}

// Circular Progress component
function CircularProgress({
  value,
  color,
  size = 80,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Get color based on value thresholds
function getMetricColor(value: number): string {
  if (value > 0.3) return "#22c55e"; // green-500
  if (value > 0.1) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [trainingState, setTrainingState] = useState<TrainingState | null>(
    null
  );
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [isStartingTraining, setIsStartingTraining] = useState(false);
  const [isLoadingTrainingStatus, setIsLoadingTrainingStatus] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [animateMetrics, setAnimateMetrics] = useState(false);

  // 비로그인 시 즉시 리다이렉트
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      router.push("/login");
    }
  }, [router]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiFetch("/studio-recipe/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastUpdated(new Date());
      }
    } catch {
      toast({
        title: "오류",
        description: "지표를 불러오는 데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  const fetchTrainingStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/studio-recipe/admin/train-bpr/status");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setTrainingState(data.state);
        }
      }
    } catch {
      console.error("Failed to fetch training status");
    } finally {
      setIsLoadingTrainingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchTrainingStatus();
  }, [fetchMetrics, fetchTrainingStatus]);

  // Auto-refresh training status every 3 seconds when running
  useEffect(() => {
    if (trainingState?.running) {
      const interval = setInterval(() => {
        fetchTrainingStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [trainingState?.running, fetchTrainingStatus]);

  const handleRecomputeMetrics = async () => {
    setIsRecomputing(true);
    try {
      const res = await apiFetch("/studio-recipe/admin/metrics/recompute", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.saved) {
          // Trigger animation
          setAnimateMetrics(true);
          setTimeout(() => setAnimateMetrics(false), 700);
          setMetrics(data.saved);
          setLastUpdated(new Date());
          toast({
            title: "성공",
            description: `지표가 업데이트되었습니다 (소요시간: ${data.tookMs}ms)`,
          });
        }
      } else {
        throw new Error("Failed to recompute");
      }
    } catch {
      toast({
        title: "오류",
        description: "Flask 서버 연결 실패",
        variant: "destructive",
      });
    } finally {
      setIsRecomputing(false);
    }
  };

  const handleStartTraining = async () => {
    setIsStartingTraining(true);
    try {
      const res = await apiFetch("/studio-recipe/admin/train-bpr", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          toast({
            title: "성공",
            description: data.message || "BPR 모델 학습이 시작되었습니다.",
          });
          // Refresh training status
          fetchTrainingStatus();
        }
      } else {
        throw new Error("Failed to start training");
      }
    } catch {
      toast({
        title: "오류",
        description: "학습 시작에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsStartingTraining(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const metricCards = [
    {
      key: "recallAt10",
      label: "Recall@10",
      icon: Target,
      value: metrics?.recallAt10 ?? 0,
    },
    {
      key: "ndcgAt10",
      label: "NDCG@10",
      icon: TrendingUp,
      value: metrics?.ndcgAt10 ?? 0,
    },
    {
      key: "hitRateAt10",
      label: "Hit Rate@10",
      icon: Activity,
      value: metrics?.hitRateAt10 ?? 0,
    },
    {
      key: "coverage",
      label: "Coverage",
      icon: Layers,
      value: metrics?.coverage ?? 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">
            관리자 대시보드
          </h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              마지막 업데이트: {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>

        {/* Metrics Section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">추천 지표</h2>
            <Button
              onClick={handleRecomputeMetrics}
              disabled={isRecomputing}
              className="gap-2"
            >
              {isRecomputing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              지표 재계산
            </Button>
          </div>

          {isLoadingMetrics ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                const percentage = metric.value * 100;
                const color = getMetricColor(metric.value);
                return (
                  <Card
                    key={metric.key}
                    className={`bg-card transition-transform duration-300 ${
                      animateMetrics ? "scale-105" : ""
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </CardTitle>
                      <Icon className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center pt-2">
                      <CircularProgress value={percentage} color={color} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Training Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              BPR 모델 학습
            </h2>
            <Button
              onClick={handleStartTraining}
              disabled={isStartingTraining || trainingState?.running}
              className="gap-2"
            >
              {isStartingTraining ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              BPR 모델 학습 시작
            </Button>
          </div>

          {isLoadingTrainingStatus ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  학습 상태
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">상태:</span>
                  {trainingState?.running ? (
                    <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-green-400">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium">실행중</span>
                    </div>
                  ) : trainingState?.last_success ? (
                    <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">완료</span>
                    </div>
                  ) : trainingState?.last_error ? (
                    <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">실패</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                      <span className="text-sm font-medium">대기중</span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {trainingState?.last_error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-sm text-red-400">
                      {trainingState.last_error}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      마지막 시작 시간
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDateTime(trainingState?.last_started_at ?? "")}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">
                      마지막 완료 시간
                    </p>
                    <p className="font-medium text-foreground">
                      {formatDateTime(trainingState?.last_finished_at ?? "")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
