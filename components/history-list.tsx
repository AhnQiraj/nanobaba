"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type HistoryItem = {
  id: string;
  prompt: string;
  createdAt: string;
  imageUrl?: string;
};

export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    async function loadItems() {
      const response = await fetch("/api/history");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { items?: HistoryItem[] };
      setItems(data.items ?? []);
    }

    function handleRefresh() {
      void loadItems();
    }

    void loadItems();
    window.addEventListener("nanobaba:history-refresh", handleRefresh);

    return () => {
      window.removeEventListener("nanobaba:history-refresh", handleRefresh);
    };
  }, []);

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
      {items.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-[1.6rem] border border-stone-200 bg-white/80 p-3"
            >
              {item.imageUrl ? (
                <img
                  className="aspect-[4/3] w-full rounded-[1.1rem] border border-stone-200 object-cover"
                  src={item.imageUrl}
                  alt={item.prompt}
                />
              ) : null}
              <p className="mt-3 text-sm font-medium leading-6 text-stone-900">
                {item.prompt}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {new Date(item.createdAt).toLocaleString("zh-CN")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-[1.8rem] border border-dashed border-stone-300 bg-white/70 p-5">
          <p className="text-sm leading-6 text-stone-500">
            这里会展示最近生成成功的图片记录，方便重新查看和下载。
          </p>
        </div>
      )}
    </Card>
  );
}
