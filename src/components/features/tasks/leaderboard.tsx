"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Medal,
  Flame,
  Crown,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { getLeaderboard, type LeaderboardEntry } from "@/actions/task-decks";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "all";

interface LeaderboardProps {
  initialData?: {
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
    totalParticipants: number;
    period: Period;
  };
}

export function Leaderboard({ initialData }: LeaderboardProps) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<Period>(initialData?.period || "week");
  const [data, setData] = useState(initialData);

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
    startTransition(async () => {
      const result = await getLeaderboard(newPeriod);
      setData(result);
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 2:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case 3:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "";
    }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <div className="flex gap-1">
            {(["week", "month", "all"] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handlePeriodChange(p)}
                disabled={isPending}
                className="text-xs px-2"
              >
                {p === "week" ? "Week" : p === "month" ? "Month" : "All Time"}
              </Button>
            ))}
          </div>
        </div>
        {data.currentUserRank > 0 && (
          <p className="text-sm text-muted-foreground">
            You&apos;re ranked #{data.currentUserRank} of {data.totalParticipants}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {data.leaderboard.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No completions yet this {period}</p>
            <p className="text-sm">Complete tasks to get on the board!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  entry.isCurrentUser && "bg-primary/5 ring-1 ring-primary/20",
                  entry.rank <= 3 && !entry.isCurrentUser && getRankBadgeColor(entry.rank)
                )}
              >
                {/* Rank */}
                <div className="w-6 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar className="h-9 w-9">
                  <AvatarImage src={entry.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(entry.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name & Stats */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      entry.isCurrentUser && "text-primary"
                    )}>
                      {entry.isCurrentUser ? "You" : entry.name}
                    </span>
                    {entry.streak >= 3 && (
                      <Badge variant="outline" className="gap-1 text-xs py-0">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {entry.streak}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.completedTasks} completed
                    {entry.skippedTasks > 0 && ` · ${entry.skippedTasks} skipped`}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right">
                  <span className="text-lg font-bold">{entry.completedTasks}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
