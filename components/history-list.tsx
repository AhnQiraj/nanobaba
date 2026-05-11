"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type HistoryItem = {
  id: string;
  prompt: string;
  createdAt: string;
  imageUrl?: string;
};

export type UseHistoryImageEventDetail = {
  id: string;
  prompt: string;
  imageUrl: string;
};

export function HistoryRail() {
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

  function handleUseAsReferenceImage(item: HistoryItem) {
    if (!item.imageUrl) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent<UseHistoryImageEventDetail>(
        "nanobaba:use-history-image",
        {
          detail: {
            id: item.id,
            prompt: item.prompt,
            imageUrl: item.imageUrl,
          },
        },
      ),
    );
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            archive
          </p>
          <h2 className="mt-1 text-base font-semibold text-stone-900">
            最近历史
          </h2>
        </div>
        <p className="text-xs text-stone-500">可参考生成</p>
      </div>
      <ScrollArea className="mt-3">
        <div className="flex gap-2 pb-2">
            {items.length > 0 ? (
              items.map((item) => (
                <article
                  key={item.id}
                  className="group w-28 shrink-0 rounded-2xl border border-stone-200 bg-white/80 p-1.5"
                  title={item.prompt}
                >
                  {item.imageUrl ? (
                    <img
                      className="aspect-square w-full rounded-xl border border-stone-200 object-cover"
                      src={item.imageUrl}
                      alt={item.prompt}
                    />
                  ) : null}
                  <div className="mt-1.5">
                    {item.imageUrl ? (
                      <Button
                        className="h-7 w-full px-2 text-xs opacity-85 group-hover:opacity-100"
                        onClick={() => handleUseAsReferenceImage(item)}
                      >
                        参考
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="min-w-full rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4">
                <p className="text-sm leading-6 text-stone-500">
                  这里会展示最近生成成功的图片记录，方便重新查看和下载。
                </p>
              </div>
            )}
        </div>
      </ScrollArea>
    </Card>
  );
}
