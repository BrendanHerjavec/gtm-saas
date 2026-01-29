"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Video,
  Gift,
  Mail,
  PenLine,
  Calendar,
  Zap,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { getLeaderboard, type LeaderboardEntry, type LeaderboardStats } from "@/actions/task-decks";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

type Period = "week" | "month" | "all";

interface LeaderboardProps {
  initialData?: {
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
    totalParticipants: number;
    period: Period;
    stats?: LeaderboardStats;
  };
  compact?: boolean;
}

const taskTypeIcons: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-3 w-3" />,
  HANDWRITTEN_NOTE: <PenLine className="h-3 w-3" />,
  GIFT: <Gift className="h-3 w-3" />,
  EXPERIENCE: <Calendar className="h-3 w-3" />,
  DIRECT_MAIL: <Mail className="h-3 w-3" />,
};

const taskTypeLabels: Record<string, string> = {
  VIDEO: "Video",
  HANDWRITTEN_NOTE: "Notes",
  GIFT: "Gifts",
  EXPERIENCE: "Exp.",
  DIRECT_MAIL: "Mail",
};

export function Leaderboard({ initialData, compact = false }: LeaderboardProps) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<Period>(initialData?.period || "week");
  const [data, setData] = useState(initialData);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      startTransition(async () => {
        const result = await getLeaderboard(period);
        setData(result);
      });
    }
  }, [initialData, period]);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setExpandedUser(null);
    startTransition(async () => {
      const result = await getLeaderboard(newPeriod);
      setData(result);
    });
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Crown className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">2</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">3</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6">
            <span className="text-xs font-medium text-muted-foreground">{rank}</span>
          </div>
        );
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "same", previousRank: number | null) => {
    if (trend === "up") {
      return (
        <div className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          {previousRank && <span className="text-[10px]">+{previousRank - (data?.leaderboard.find(e => e.previousRank === previousRank)?.rank || 0)}</span>}
        </div>
      );
    }
    if (trend === "down") {
      return (
        <div className="flex items-center gap-0.5 text-red-500 dark:text-red-400">
          <TrendingDown className="h-3 w-3" />
        </div>
      );
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-2 w-12 bg-muted rounded" />
                </div>
                <div className="h-4 w-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <div className="flex rounded-lg border bg-muted/50 p-0.5">
            {(["week", "month", "all"] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                disabled={isPending}
                className={cn(
                  "text-xs px-2 h-7 rounded-md",
                  period === p && "bg-background shadow-sm"
                )}
              >
                {p === "week" ? "7d" : p === "month" ? "30d" : "All"}
              </Button>
            ))}
          </div>
        </div>

        {/* Team Stats Bar */}
        {data.stats && !compact && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="p-1 rounded bg-primary/10">
                <Target className="h-3 w-3 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{data.stats.teamTotal}</div>
                <div className="text-[10px] text-muted-foreground">Team total</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="p-1 rounded bg-blue-500/10">
                <Users className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <div className="font-semibold">{data.stats.teamAvgPerUser}</div>
                <div className="text-[10px] text-muted-foreground">Avg/user</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="p-1 rounded bg-purple-500/10">
                {taskTypeIcons[data.stats.topTaskType] || <Zap className="h-3 w-3 text-purple-500" />}
              </div>
              <div>
                <div className="font-semibold">{taskTypeLabels[data.stats.topTaskType]}</div>
                <div className="text-[10px] text-muted-foreground">Top type</div>
              </div>
            </div>
          </div>
        )}

        {data.currentUserRank > 0 && (
          <p className="text-xs text-muted-foreground">
            You&apos;re <span className="font-medium text-foreground">#{data.currentUserRank}</span> of {data.totalParticipants} this {period === "all" ? "period" : period}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        {data.leaderboard.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No completions yet</p>
            <p className="text-xs">Complete tasks to get on the board!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.leaderboard.map((entry) => (
              <Collapsible
                key={entry.userId}
                open={expandedUser === entry.userId}
                onOpenChange={(open) => setExpandedUser(open ? entry.userId : null)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                      entry.isCurrentUser && "bg-primary/5 ring-1 ring-primary/20",
                      entry.rank === 1 && !entry.isCurrentUser && "bg-yellow-50/50 dark:bg-yellow-900/10",
                      expandedUser === entry.userId && "bg-muted/50"
                    )}
                  >
                    {/* Rank */}
                    {getRankDisplay(entry.rank)}

                    {/* Avatar */}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.image || undefined} />
                      <AvatarFallback className="text-[10px] font-medium">
                        {getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Quick Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            entry.isCurrentUser && "text-primary"
                          )}
                        >
                          {entry.isCurrentUser ? "You" : entry.name}
                        </span>
                        {entry.streak >= 3 && (
                          <Badge variant="outline" className="gap-0.5 text-[10px] py-0 px-1 h-4 border-orange-200 dark:border-orange-800">
                            <Flame className="h-2.5 w-2.5 text-orange-500" />
                            {entry.streak}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{entry.completionRate}% rate</span>
                        <span>·</span>
                        <span>{entry.avgPerDay}/day</span>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className="flex items-center gap-1">
                      {getTrendIcon(entry.trend, entry.previousRank)}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 min-w-[40px] justify-end">
                      <span className="text-base font-bold">{entry.completedTasks}</span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                        expandedUser === entry.userId && "rotate-90"
                      )} />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-2 pb-2 pt-1 ml-8 space-y-3">
                    {/* Task Type Breakdown */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        <BarChart3 className="h-3 w-3" />
                        By Type
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {Object.entries(entry.tasksByType).map(([type, count]) => (
                          <div
                            key={type}
                            className={cn(
                              "flex flex-col items-center p-1.5 rounded bg-muted/50 text-center",
                              count > 0 && "bg-primary/5"
                            )}
                          >
                            <div className={cn("text-muted-foreground", count > 0 && "text-primary")}>
                              {taskTypeIcons[type]}
                            </div>
                            <span className="text-xs font-semibold">{count}</span>
                            <span className="text-[8px] text-muted-foreground">{taskTypeLabels[type]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Completion Rate</span>
                          <span className="font-medium">{entry.completionRate}%</span>
                        </div>
                        <Progress value={entry.completionRate} className="h-1.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Best Streak</span>
                          <span className="font-medium flex items-center gap-0.5">
                            <Flame className="h-2.5 w-2.5 text-orange-500" />
                            {entry.bestStreak} days
                          </span>
                        </div>
                        <Progress value={Math.min((entry.streak / entry.bestStreak) * 100, 100)} className="h-1.5" />
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                      <span>
                        {entry.completedTasks} completed · {entry.skippedTasks} skipped
                      </span>
                      {entry.previousRank && (
                        <span>
                          Last {period === "week" ? "week" : period === "month" ? "month" : "period"}: #{entry.previousRank}
                        </span>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
