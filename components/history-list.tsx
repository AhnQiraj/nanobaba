import { Card } from "@/components/ui/card";

export function HistoryList() {
  return (
    <Card className="p-6 md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            archive
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            最近历史
          </h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
          保留 30 天
        </span>
      </div>
      <div className="mt-5 rounded-[1.8rem] border border-dashed border-stone-300 bg-white/70 p-5">
        <p className="text-sm leading-6 text-stone-500">
          这里会展示最近生成成功的图片记录，方便重新查看和下载。
        </p>
      </div>
    </Card>
  );
}
