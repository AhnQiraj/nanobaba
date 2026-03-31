import { ImageResultCard } from "@/components/image-result-card";
import { HistoryList } from "@/components/history-list";
import { LogoutButton } from "@/components/logout-button";
import { PromptComposer } from "@/components/prompt-composer";
import { redirectIfLoggedOut } from "@/lib/auth-guard";

export default async function HomePage() {
  await redirectIfLoggedOut();

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,250,241,0.96),rgba(242,230,207,0.92))] p-6 shadow-[0_30px_80px_rgba(108,77,37,0.12)] md:p-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(255,220,154,0.45),transparent_55%)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-stone-500">
                AhnQiraj Image Studio
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
                AhnQiraj的生图站
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600 md:text-base">
                在这里写下想要的画面，生成结果会保存在本地，并自动保留最近 30
                天的历史记录。
              </p>
            </div>
            <LogoutButton />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <section className="space-y-6">
            <PromptComposer />
            <ImageResultCard />
          </section>
          <aside>
            <HistoryList />
          </aside>
        </div>
      </div>
    </main>
  );
}
