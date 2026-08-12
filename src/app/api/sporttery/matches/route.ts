import { NextResponse } from "next/server";
import {
  fetchSportteryMatches,
  calculatePoisson,
  calculateV42,
  type SportteryMatch,
} from "@/lib/sporttery";

export const revalidate = 300; // 5分钟缓存

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // all / poisson / v42 / basic

  try {
    const matches = await fetchSportteryMatches();

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "今日暂无竞彩比赛在售",
        count: 0,
      });
    }

    let result: any[] = matches;

    if (type === "poisson" || type === "all") {
      result = matches.map((m: SportteryMatch) => ({
        ...m,
        poisson:
          m.spf_home > 0 && m.spf_draw > 0 && m.spf_away > 0
            ? calculatePoisson(m.spf_home, m.spf_draw, m.spf_away)
            : null,
      }));
    }

    if (type === "v42" || type === "all") {
      result = result.map((m: any) => ({
        ...m,
        v42:
          m.spf_home > 0 && m.spf_draw > 0 && m.spf_away > 0
            ? calculateV42(
                m.spf_home,
                m.spf_draw,
                m.spf_away,
                m.rspf_home,
                m.rspf_draw,
                m.rspf_away,
                m.handicap,
                m.score_odds || []
              )
            : null,
      }));
    }

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API sporttery] 错误:", error);
    return NextResponse.json(
      { success: false, error: error.message || "获取数据失败" },
      { status: 500 }
    );
  }
}
