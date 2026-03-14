"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { convertFileSize } from "@/lib/utils";

function calculatePercentage(used: number, limit: number) {
  if (!limit) return 0;
  return Math.min(100, (used / limit) * 100);
}

const chartConfig = {
  size: {
    label: "Size",
  },
  used: {
    label: "Used",
    color: "white",
  },
} satisfies ChartConfig;

export const Chart = ({
  used = 0,
  limit = 2 * 1024 * 1024 * 1024,
}: {
  used?: number;
  limit?: number;
}) => {
  const pct = calculatePercentage(used, limit);
  const chartData = [{ storage: "used", 10: used, fill: "white" }];

  return (
    <Card className="chart">
      <CardContent className="flex-1 p-0">
        <ChartContainer config={chartConfig} className="chart-container">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={pct + 90}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="polar-grid"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="storage" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="chart-total-percentage"
                        >
                          {pct ? pct.toFixed(0) : "0"}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-white/70"
                        >
                          Space used
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardHeader className="chart-details">
        <CardTitle className="chart-title">Available Storage</CardTitle>
        <CardDescription className="chart-description">
          {convertFileSize(used)} / {limit ? convertFileSize(limit) : "—"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
