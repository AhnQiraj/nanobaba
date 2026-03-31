import { Card } from "@/components/ui/card";

export function ImageResultCard() {
  return (
    <Card className="overflow-hidden p-6 md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            result
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            当前结果
          </h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
          生成完成后可下载
        </span>
      </div>
      <div className="mt-5 rounded-[1.8rem] border border-dashed border-stone-300 bg-[linear-gradient(180deg,rgba(250,244,232,0.85),rgba(255,255,255,0.92))] p-8">
        <div className="aspect-[4/3] rounded-[1.4rem] bg-[radial-gradient(circle_at_top,#f9ddb1,transparent_36%),linear-gradient(180deg,#faf7ef_0%,#efe7d7_100%)]" />
        <p className="mt-4 text-sm leading-6 text-stone-500">
          生成完成后，图片会显示在这里，并提供下载入口。
        </p>
      </div>
    </Card>
  );
}
