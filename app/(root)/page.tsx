import { Chart } from "@/components/Chart";
import { DashboardRecentFileRow } from "@/components/DashboardRecentFileRow";
import { DashboardSummaryCard } from "@/components/DashboardSummaryCard";
import { getDriveFiles, getDriveTotalSpaceUsed, getDriveStarredSummary } from "@/lib/actions/drive.actions";
import { getUsageSummary } from "@/lib/utils";
import type { DriveFileDisplay } from "@/lib/google-drive";

const Dashboard = async () => {
  const [filesRes, totalSpace, starredSummary] = await Promise.all([
    getDriveFiles({ types: [], limit: 10 }),
    getDriveTotalSpaceUsed(),
    getDriveStarredSummary(),
  ]);
  const files = filesRes ?? { documents: [], total: 0 };
  const totalSpaceSafe = totalSpace ?? {
    used: 0,
    all: 2 * 1024 * 1024 * 1024,
    document: { size: 0, latestDate: "" },
    image: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
  };
  const usageSummary = getUsageSummary(totalSpaceSafe, starredSummary ?? undefined);

  return (
    <div className="dashboard-container">
      <section>
        <Chart used={totalSpaceSafe.used} limit={totalSpaceSafe.all} />

        {/* Uploaded file type summaries */}
        <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <DashboardSummaryCard key={summary.title} summary={summary} />
          ))}
        </ul>
      </section>

      {/* Recent files from Google Drive */}
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent files</h2>
        {files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {files.documents.map((file: DriveFileDisplay) => (
              <li key={file.$id}>
                <DashboardRecentFileRow file={file} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No files in Drive</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
