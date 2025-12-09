import { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  FileCode,
  Image as ImageIcon,
  Trash2,
  GripVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  Eye,
} from "lucide-react";

const QueueItem = ({
  item,
  onDelete,
  onViewGcode,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggable = true,
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <div className="badge badge-ghost gap-2">
            <Circle className="w-3 h-3" />
            Pending
          </div>
        );
      case "processing":
        return (
          <div className="badge badge-info gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </div>
        );
      case "completed":
        return (
          <div className="badge badge-success gap-2">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </div>
        );
      case "failed":
        return (
          <div className="badge badge-error gap-2">
            <XCircle className="w-3 h-3" />
            Failed
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "text":
        return <FileCode className="w-4 h-4" />;
      default:
        return <FileCode className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div
        className="bg-gradient-to-br from-base-100 to-base-200 rounded-2xl p-4 shadow-xl border-2 border-base-300/50 hover:border-primary/50 hover:shadow-2xl transition-all group"
        onDragOver={(e) => {
          e.preventDefault();
          if (onDragOver) onDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (onDrop) onDrop(e);
        }}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          {draggable && item.status === "pending" && (
            <div
              className="flex items-center justify-center text-base-content/20 group-hover:text-primary cursor-grab active:cursor-grabbing transition-colors touch-none"
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                if (onDragStart) onDragStart(e);
              }}
              onDragEnd={(e) => {
                e.stopPropagation();
                if (onDragEnd) onDragEnd(e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-5 h-5 pointer-events-none" />
            </div>
          )}

          {/* Preview Image */}
          {item.processedImage && (
            <div className="flex-shrink-0">
              <img
                src={item.processedImage}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-xl bg-base-300 border-2 border-base-300/50 shadow-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 bg-base-200/50 px-3 py-1 rounded-lg">
                {getTypeIcon(item.type)}
                <span className="font-bold text-xs uppercase tracking-wide text-base-content/80">
                  {item.type} Mode
                </span>
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Stats */}
            {item.stats && (
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                {item.stats.totalLines && (
                  <div className="flex items-center gap-1.5 text-base-content/70 bg-info/10 px-2 py-1 rounded-lg">
                    <FileCode className="w-3.5 h-3.5 text-info" />
                    <span className="font-medium">
                      {item.stats.totalLines} lines
                    </span>
                  </div>
                )}
                {item.stats.estimatedTime && (
                  <div className="flex items-center gap-1.5 text-base-content/70 bg-success/10 px-2 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-success" />
                    <span className="font-medium">
                      {item.stats.estimatedTime}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-base-content/50 flex items-center gap-1.5 mb-2">
              <Clock className="w-3 h-3" />
              Added at {formatTime(item.timestamp)}
            </div>

            {/* View G-code Button */}
            <button
              onClick={() => onViewGcode && onViewGcode(item)}
              className="btn btn-xs btn-outline btn-primary gap-1.5 mt-2"
            >
              <Eye className="w-3 h-3" />
              View G-code
            </button>

            {/* Error Message */}
            {item.error && (
              <div className="mt-3 p-2.5 bg-error/10 border-2 border-error/30 rounded-lg text-xs text-error font-semibold">
                ⚠️ {item.error}
              </div>
            )}

            {/* Processing Progress */}
            {item.status === "processing" && item.stats?.totalLines && (
              <div className="mt-3 bg-info/10 p-3 rounded-lg border border-info/20">
                <div className="flex items-center justify-between text-xs mb-2 font-semibold">
                  <span className="text-info">Processing...</span>
                  <span className="text-info">
                    {item.currentLine} / {item.stats.totalLines}
                  </span>
                </div>
                <progress
                  className="progress progress-info w-full h-2"
                  value={item.currentLine}
                  max={item.stats.totalLines}
                ></progress>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(item.id)}
            className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/20 hover:scale-110 transition-all shadow-lg"
            disabled={item.status === "processing"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default QueueItem;
