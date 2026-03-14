"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import { convertFileSize } from "@/lib/utils";

type Summary = {
  title: string;
  size: number;
  latestDate: string;
  icon: string;
  url: string;
};

export function DashboardSummaryCard({ summary }: { summary: Summary }) {
  const tooltipText = `${summary.title} – ${convertFileSize(summary.size) || "0"}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={summary.url} className="dashboard-summary-card">
          <div className="space-y-4">
            <div className="flex justify-between gap-3">
              <Image
                src={summary.icon}
                width={100}
                height={100}
                alt=""
                className="summary-type-icon"
              />
              <h4 className="summary-type-size">
                {convertFileSize(summary.size) || 0}
              </h4>
            </div>
            <h5 className="summary-type-title">{summary.title}</h5>
            <Separator className="bg-light-400" />
            <FormattedDateTime
              date={summary.latestDate}
              className="text-center"
            />
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-medium">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
