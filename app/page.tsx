import { ImageResultCard } from "@/components/image-result-card";
import { HistoryRail } from "@/components/history-list";
import { LogoutButton } from "@/components/logout-button";
import { PromptComposer } from "@/components/prompt-composer";
import { redirectIfLoggedOut } from "@/lib/auth-guard";

export default async function HomePage() {
  await redirectIfLoggedOut();

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-2xl border border-stone-200/80 bg-white/55 px-4 py-3 shadow-[0_10px_30px_rgba(108,77,37,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-lg font-semibold leading-none text-stone-950 md:text-xl">
                AhnQiraj的生图站
              </h1>
              <p className="text-xs text-stone-500">最近 30 天历史自动保留</p>
            </div>
            <LogoutButton />
          </div>
        </section>

        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(360px,0.92fr)_minmax(0,1.08fr)]">
          <section>
            <PromptComposer />
          </section>
          <section className="flex flex-col gap-5">
            <ImageResultCard />
            <HistoryRail />
          </section>
        </div>
      </div>
    </main>
  );
}
