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
} from "lucide-react";

const QueueItem = ({
  item,
  onDelete,
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
    <div
      className="bg-base-200 rounded-xl p-4 shadow-lg border border-base-300 hover:border-primary/50 transition-all cursor-move"
      draggable={draggable && item.status === "pending"}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        {draggable && item.status === "pending" && (
          <div className="flex items-center justify-center text-base-content/30 hover:text-primary cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Preview Image */}
        {item.processedImage && (
          <div className="flex-shrink-0">
            <img
              src={item.processedImage}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg bg-base-300"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {getTypeIcon(item.type)}
              <span className="font-semibold text-sm uppercase text-base-content/70">
                {item.type} Mode
              </span>
            </div>
            {getStatusBadge(item.status)}
          </div>

          {/* Stats */}
          {item.stats && (
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              {item.stats.totalLines && (
                <div className="flex items-center gap-1 text-base-content/70">
                  <FileCode className="w-3 h-3" />
                  <span>{item.stats.totalLines} lines</span>
                </div>
              )}
              {item.stats.estimatedTime && (
                <div className="flex items-center gap-1 text-base-content/70">
                  <Clock className="w-3 h-3" />
                  <span>{item.stats.estimatedTime}</span>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-base-content/50 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Added at {formatTime(item.timestamp)}
          </div>

          {/* Error Message */}
          {item.error && (
            <div className="mt-2 p-2 bg-error/10 border border-error/30 rounded text-xs text-error">
              {item.error}
            </div>
          )}

          {/* Processing Progress */}
          {item.status === "processing" && item.stats?.totalLines && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Processing...</span>
                <span>
                  {item.currentLine} / {item.stats.totalLines}
                </span>
              </div>
              <progress
                className="progress progress-info w-full"
                value={item.currentLine}
                max={item.stats.totalLines}
              ></progress>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(item.id)}
          className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
          disabled={item.status === "processing"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QueueItem;
