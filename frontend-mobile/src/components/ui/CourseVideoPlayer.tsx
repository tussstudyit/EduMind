"use client";

import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/services/apiClient";
import {
  getCourseFile,
  isStoredCourseFile,
  migrateLocalCourseFile,
  parseVideoSource,
} from "@/services/courseFileUploadService";
import { Icon } from "@/components/ui/Icons";

export interface VideoPlayableItem {
  id: string;
  title: string;
  url: string;
  fileSize?: string;
  description?: string;
}

interface CourseVideoPlayerProps {
  items: VideoPlayableItem[];
  activeItemId?: string;
  onSelectItem?: (item: VideoPlayableItem) => void;
  onWatched85Percent?: () => void;
  isTeacherPreview?: boolean;
}

export function CourseVideoPlayer({
  items,
  activeItemId,
  onSelectItem,
  onWatched85Percent,
  isTeacherPreview = false,
}: CourseVideoPlayerProps) {
  const [selectedId, setSelectedId] = useState<string>(activeItemId || items[0]?.id || "");
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string>("");
  const [isLoadingStream, setIsLoadingStream] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string>("");
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasNoAudioTrack, setHasNoAudioTrack] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const notifiedCompleteRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeItemId && items.some((i) => i.id === activeItemId)) {
      setSelectedId(activeItemId);
    } else if (!items.some((i) => i.id === selectedId)) {
      setSelectedId(items[0]?.id || "");
    }
  }, [activeItemId, items]);

  const currentItem = items.find((i) => i.id === selectedId) || items[0] || null;
  const parsedSource = parseVideoSource(currentItem?.url);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    setResolvedStreamUrl("");
    setStreamError("");
    setHasNoAudioTrack(false);

    if (!currentItem || !parsedSource) return;

    if (parsedSource.provider !== "server-file") {
      setResolvedStreamUrl(parsedSource.embedUrl);
      return;
    }

    setIsLoadingStream(true);
    const rawFileId = isStoredCourseFile(currentItem.url)
      ? currentItem.url.slice("course-file://".length).split(".")[0]
      : currentItem.id;
    const materialId = currentItem.id.startsWith("mat-") ? currentItem.id : rawFileId;

    apiClient
      .createMaterialPlaybackUrl(materialId)
      .then(({ streamUrl }) => {
        if (!cancelled) {
          setResolvedStreamUrl(streamUrl);
          setIsLoadingStream(false);
        }
      })
      .catch(async () => {
        try {
          const localStored = await getCourseFile(materialId);
          if (!localStored || cancelled) {
            if (!cancelled) {
              setStreamError(
                "Tệp video đang chờ trình duyệt của Giảng viên đồng bộ lên Server, hoặc Giảng viên có thể gắn trực tiếp link Google Drive cho buổi học này.",
              );
              setIsLoadingStream(false);
            }
            return;
          }
          objectUrl = URL.createObjectURL(localStored.blob);
          setResolvedStreamUrl(objectUrl);
          setIsLoadingStream(false);
          // Tự động đồng bộ bản lưu cục bộ trong trình duyệt lên máy chủ Docker ở chế độ nền
          void migrateLocalCourseFile(materialId, localStored.courseId || "", "").catch(() => undefined);
        } catch {
          if (!cancelled) {
            setStreamError(
              "Chưa thể phát tệp video này từ máy chủ. Giảng viên hãy tải lại tệp video hoặc dán link Google Drive vào buổi học.",
            );
            setIsLoadingStream(false);
          }
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentItem?.id, currentItem?.url]);

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // Trình duyệt không hỗ trợ PiP
    }
  };

  if (!items.length || !currentItem || !parsedSource) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "220px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <span
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.16)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="play" size={22} />
        </span>
        <strong style={{ marginTop: "12px", fontSize: "13px" }}>
          Chưa có video bài giảng cho buổi học này
        </strong>
        <span style={{ marginTop: "4px", fontSize: "11px", color: "#c7d2fe" }}>
          Giảng viên có thể dán link Google Drive / YouTube hoặc tải tệp video MP4 lên buổi học.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "14px",
        borderRadius: "12px",
        background: "#0f172a",
        border: "1px solid #1e293b",
        color: "#f8fafc",
      }}
    >
      {/* Top Toolbar: Video Title, Source Badge & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "3px 9px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 800,
              background:
                parsedSource.provider === "google-drive"
                  ? "#0284c7"
                  : parsedSource.provider === "youtube"
                  ? "#dc2626"
                  : "#4f46e5",
              color: "#ffffff",
            }}
          >
            {parsedSource.provider === "google-drive"
              ? "☁️ GOOGLE DRIVE STREAM"
              : parsedSource.provider === "youtube"
              ? "▶️ YOUTUBE STREAM"
              : "🎬 SERVER VIDEO STREAM"}
          </span>
          <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{currentItem.title}</strong>
          {currentItem.fileSize && (
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>({currentItem.fileSize})</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {!parsedSource.isIframe && resolvedStreamUrl && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  background: "#1e293b",
                  padding: "3px 6px",
                  borderRadius: "6px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#94a3b8", marginRight: 2 }}>Tốc độ:</span>
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeedChange(rate)}
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "none",
                      background: playbackRate === rate ? "#4f46e5" : "transparent",
                      color: playbackRate === rate ? "#ffffff" : "#cbd5e1",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleTogglePiP()}
                title="Thu nhỏ video góc màn hình (Picture-in-Picture)"
                style={{
                  padding: "4px 9px",
                  borderRadius: "6px",
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#e2e8f0",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📺 Thu nhỏ góc
              </button>
            </>
          )}

          {parsedSource.isIframe && (
            <a
              href={parsedSource.directViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#38bdf8",
                fontSize: "11px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ↗️ Mở trên {parsedSource.provider === "google-drive" ? "Google Drive" : "Tab mới"}
            </a>
          )}
        </div>
      </div>

      {/* Playlist Selector if multiple videos exist in this lesson */}
      {items.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "4px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          {items.map((item, idx) => {
            const active = item.id === currentItem.id;
            const itemParsed = parseVideoSource(item.url);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedId(item.id);
                  onSelectItem?.(item);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: active ? "1.5px solid #6366f1" : "1px solid #334155",
                  background: active ? "#312e81" : "#1e293b",
                  color: active ? "#ffffff" : "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>
                  {itemParsed?.provider === "google-drive"
                    ? "☁️"
                    : itemParsed?.provider === "youtube"
                    ? "▶️"
                    : "🎬"}
                </span>
                <span>
                  Phần {idx + 1}: {item.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Video Frame */}
      {isLoadingStream ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            maxHeight: "460px",
            borderRadius: "10px",
            background: "#020617",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0" }}>
            Đang kết nối luồng phát video bài giảng...
          </span>
        </div>
      ) : streamError ? (
        <div
          style={{
            width: "100%",
            minHeight: "220px",
            borderRadius: "10px",
            background: "#1e1b4b",
            border: "1px dashed #6366f1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            gap: "8px",
          }}
        >
          <Icon name="alertCircle" size={24} />
          <strong style={{ fontSize: "13px", color: "#f8fafc" }}>
            Tệp video đang chờ đồng bộ hoặc chưa sẵn sàng trên Server
          </strong>
          <p style={{ margin: 0, fontSize: "11.5px", color: "#c7d2fe", maxWidth: "520px", lineHeight: 1.55 }}>
            {streamError}
          </p>
        </div>
      ) : parsedSource.isIframe ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <iframe
            key={resolvedStreamUrl}
            src={resolvedStreamUrl}
            title={currentItem.title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              maxHeight: "480px",
              border: "0",
              borderRadius: "10px",
              background: "#000000",
            }}
          />
          {parsedSource.provider === "google-drive" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "10.5px",
                color: "#94a3b8",
                padding: "2px 4px",
              }}
            >
              <span>
                💡 Phát trực tiếp từ Google Drive.{" "}
                {isTeacherPreview
                  ? "Hãy đảm bảo tệp trên Drive đã bật quyền 'Bất kỳ ai có đường liên kết đều có thể xem'."
                  : "Nếu video không hiển thị trên trình duyệt chặn cookie bên thứ ba, hãy bấm 'Mở trên Google Drive' ở góc phải."}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <video
            ref={videoRef}
            key={resolvedStreamUrl}
            src={resolvedStreamUrl}
            controls
            preload="metadata"
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              vid.playbackRate = playbackRate;
              vid.muted = false;
              if (vid.volume === 0) vid.volume = 1;
              try {
                const savedTime = Number(window.localStorage.getItem(`edumind_vpos_${currentItem.id}`) || 0);
                if (savedTime > 5 && savedTime < vid.duration - 5) {
                  vid.currentTime = savedTime;
                }
              } catch {
                // ignore
              }
            }}
            onTimeUpdate={(e) => {
              const vid = e.currentTarget as HTMLVideoElement & {
                mozHasAudio?: boolean;
                webkitAudioDecodedByteCount?: number;
                audioTracks?: { length: number };
              };
              if (!vid.duration) return;

              // Kiểm tra sau 1.5 giây phát nếu tệp MP4 gốc hoàn toàn không có kênh âm thanh (ví dụ file videoplayback DASH của YouTube)
              if (vid.currentTime > 1.5 && !hasNoAudioTrack) {
                const noAudio =
                  vid.mozHasAudio === false ||
                  (vid.audioTracks !== undefined && vid.audioTracks.length === 0) ||
                  (vid.webkitAudioDecodedByteCount !== undefined && vid.webkitAudioDecodedByteCount === 0);
                if (noAudio) {
                  setHasNoAudioTrack(true);
                }
              }

              try {
                window.localStorage.setItem(`edumind_vpos_${currentItem.id}`, String(Math.floor(vid.currentTime)));
              } catch {
                // ignore
              }
              if (
                onWatched85Percent &&
                !notifiedCompleteRef.current.has(currentItem.id) &&
                vid.currentTime / vid.duration >= 0.85
              ) {
                notifiedCompleteRef.current.add(currentItem.id);
                onWatched85Percent();
              }
            }}
            style={{
              width: "100%",
              maxHeight: "480px",
              aspectRatio: "16 / 9",
              borderRadius: "10px",
              background: "#000000",
            }}
          >
            Trình duyệt của bạn không hỗ trợ phát video HTML5.
          </video>

          {hasNoAudioTrack && (
            <div
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                background: "#451a03",
                border: "1px solid #f59e0b",
                color: "#fef3c7",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              🔇 <strong>Phát hiện tệp video gốc không chứa kênh âm thanh (Video-Only Stream):</strong> Tệp{" "}
              <code>{currentItem.title}</code> trên máy tính khi tải về thuộc định dạng tách luồng (DASH Video-Only, chỉ có 1 kênh hình ảnh <code>vide</code>, không có kênh âm thanh <code>soun</code> bên trong tệp). Để có đầy đủ tiếng, Giảng viên hãy bấm <strong>&quot;☁️ Dán link Video Drive / YouTube&quot;</strong> để dẫn trực tiếp link gốc hoặc tải lên file MP4 có ghép sẵn tiếng.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
