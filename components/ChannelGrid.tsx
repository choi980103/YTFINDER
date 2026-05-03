"use client";

import { useState, useRef, useCallback } from "react";
import { Channel } from "@/data/mockChannels";
import ChannelCard from "./ChannelCard";
import ChannelListItem from "./ChannelListItem";

const PAGE_SIZE_GRID = 12;
const PAGE_SIZE_LIST = 20;

type ViewMode = "grid" | "list";

interface ChannelGridProps {
  channels: Channel[];
  favorites: Set<string>;
  favoriteOrder: string[];
  onToggleFavorite: (id: string) => void;
  onReorderFavorites: (fromIndex: number, toIndex: number) => void;
  onHideChannel?: (id: string) => void;
  showFavoritesOnly: boolean;
  page?: number;
  onPageChange?: (page: number) => void;
}

export default function ChannelGrid({
  channels,
  favorites,
  favoriteOrder,
  onToggleFavorite,
  onReorderFavorites,
  onHideChannel,
  showFavoritesOnly,
  page: externalPage,
  onPageChange,
}: ChannelGridProps) {
  const [internalPage, setInternalPage] = useState(0);
  const page = externalPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const pageSize = viewMode === "grid" ? PAGE_SIZE_GRID : PAGE_SIZE_LIST;

  // 즐겨찾기 모드일 때 순서 유지
  const displayChannels = showFavoritesOnly
    ? favoriteOrder
        .map((id) => channels.find((ch) => ch.id === id))
        .filter((ch): ch is Channel => ch !== undefined)
    : channels;

  const isDraggable = showFavoritesOnly;

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
    // 약간의 딜레이로 드래그 중 스타일 적용
    setTimeout(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.4";
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = "1";
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      onReorderFavorites(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  }, [dragIndex, dragOverIndex, onReorderFavorites]);

  // 트렌드 감지
  const avgGrowth =
    displayChannels.length > 0
      ? displayChannels.reduce((s, ch) => s + ch.growthRate, 0) / displayChannels.length
      : 0;
  const trendThreshold = avgGrowth * 1.5;
  const trendingIds = new Set(
    displayChannels
      .filter((ch) => ch.growthRate >= trendThreshold && ch.growthRate >= 200)
      .map((ch) => ch.id)
  );

  const totalPages = Math.max(1, Math.ceil(displayChannels.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = displayChannels.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize
  );

  if (displayChannels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <svg
            className="h-8 w-8 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-zinc-300">
          {showFavoritesOnly ? "즐겨찾기한 채널이 없습니다" : "검색 결과가 없습니다"}
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          {showFavoritesOnly
            ? "관심 채널에 별표를 눌러 추가해보세요"
            : "다른 키워드나 카테고리로 검색해보세요"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results count + View toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-white">
              {displayChannels.length}
            </span>
            개 채널
            {totalPages > 1 && (
              <span className="ml-1.5 text-zinc-500">
                ({safePage + 1}/{totalPages})
              </span>
            )}
          </p>
          {trendingIds.size > 0 && (
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
              급상승 {trendingIds.size}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Color legend — hidden on mobile */}
          <div className="hidden items-center gap-1.5 text-[10px] text-zinc-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#00e5a0]" />
            1000%+
            <span className="ml-1.5 h-2 w-2 rounded-full bg-[#06b6d4]" />
            500%+
            <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400" />
            200%+
          </div>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => { setViewMode("grid"); setPage(0); }}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-300"
              }`}
              title="그리드 뷰"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => { setViewMode("list"); setPage(0); }}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "list" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-300"
              }`}
              title="리스트 뷰"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Drag hint */}
      {isDraggable && displayChannels.length > 1 && (
        <div className="mb-3 flex items-center gap-2 text-[10px] text-zinc-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          드래그로 즐겨찾기 순서를 변경할 수 있어요
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((channel, index) => (
            <div
              key={channel.id}
              className={`card-animate ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""} ${
                dragOverIndex === index && dragIndex !== index ? "ring-2 ring-[#00e5a0]/40 rounded-2xl" : ""
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
              draggable={isDraggable}
              onDragStart={isDraggable ? (e) => handleDragStart(e, index) : undefined}
              onDragOver={isDraggable ? (e) => handleDragOver(e, index) : undefined}
              onDragEnd={isDraggable ? handleDragEnd : undefined}
              onDragLeave={isDraggable ? () => setDragOverIndex(null) : undefined}
            >
              <ChannelCard
                channel={channel}
                index={index}
                isFavorite={favorites.has(channel.id)}
                onToggleFavorite={onToggleFavorite}
                onHideChannel={onHideChannel}
                isTrending={trendingIds.has(channel.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-2">
          {/* List header */}
          <div className="hidden items-center gap-3 px-4 py-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:flex sm:gap-4">
            <span className="w-6 text-center">#</span>
            <span className="w-4" />
            <span className="w-9" />
            <span className="flex-1">채널</span>
            <span className="w-16 text-right">구독자</span>
            <span className="w-16 text-right">평균조회</span>
            <span className="w-20 text-right">비율</span>
            <span className="w-14 text-right">성장률</span>
            <span className="hidden w-16 lg:block" />
            <span className="w-4" />
          </div>
          {paged.map((channel, index) => (
            <div
              key={channel.id}
              className={`card-animate ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""} ${
                dragOverIndex === index && dragIndex !== index ? "ring-2 ring-[#00e5a0]/40 rounded-xl" : ""
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
              draggable={isDraggable}
              onDragStart={isDraggable ? (e) => handleDragStart(e, index) : undefined}
              onDragOver={isDraggable ? (e) => handleDragOver(e, index) : undefined}
              onDragEnd={isDraggable ? handleDragEnd : undefined}
              onDragLeave={isDraggable ? () => setDragOverIndex(null) : undefined}
            >
              <ChannelListItem
                channel={channel}
                index={index}

                isFavorite={favorites.has(channel.id)}
                onToggleFavorite={onToggleFavorite}
                isTrending={trendingIds.has(channel.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← 이전
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                i === safePage
                  ? "bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/10"
                  : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage === totalPages - 1}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
