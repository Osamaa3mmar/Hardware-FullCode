import { useState, useEffect } from "react";
import { Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import QueueList from "../components/queue/QueueList";
import QueueControls from "../components/queue/QueueControls";
import SerialLogModal from "../components/SerialLogModal";
import {
  getQueue,
  getQueueStatus,
  removeFromQueue,
  clearQueue,
  processQueue,
  processNextInQueue,
} from "../api/queueApi";

const QueuePage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isSerialLogOpen, setIsSerialLogOpen] = useState(false);
  const [currentQueueGcode, setCurrentQueueGcode] = useState("");

  // Fetch queue data
  const fetchQueue = async () => {
    try {
      const [queueData, statusData] = await Promise.all([
        getQueue(),
        getQueueStatus(),
      ]);

      setItems(queueData.items || []);
      setStats({
        total: statusData.total,
        pending: statusData.pending,
        processing: statusData.processing,
        completed: statusData.completed,
        failed: statusData.failed,
      });
      setIsProcessing(statusData.isProcessing || false);
    } catch (error) {
      console.error("Error fetching queue:", error);
      toast.error("Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket.IO connected");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    // Listen for queue updates (debounced to avoid double fetch)
    let fetchTimeout;
    newSocket.on("queue:updated", (data) => {
      console.log("Queue updated:", data);

      // Debounce the fetch to avoid multiple rapid calls
      clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchQueue();
      }, 200);
    });

    // Listen for processing updates
    newSocket.on("queue:processing", (data) => {
      console.log("Queue processing:", data);

      if (data.status === "started") {
        setIsProcessing(true);
      }

      // Update item progress
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === data.itemId
            ? {
                ...item,
                currentLine: data.current || item.currentLine,
                status: "processing",
              }
            : item
        )
      );
    });

    // Listen for completion
    newSocket.on("queue:completed", (data) => {
      console.log("Queue item completed:", data);

      if (data.status === "completed") {
        toast.success("Queue item completed successfully!");
      } else if (data.status === "failed") {
        toast.error(`Queue item failed: ${data.error}`);
      }

      // Refresh queue after completion
      setTimeout(() => {
        fetchQueue();
      }, 500);
    });

    return () => {
      clearTimeout(fetchTimeout);
      newSocket.close();
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchQueue();
  }, []);

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await removeFromQueue(id);
      toast.success("Item removed from queue");
      // fetchQueue will be called by socket event
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to remove item");
    }
  };

  // Handle process queue
  const handleProcess = async () => {
    try {
      // Get the first pending item's gcode
      const pendingItems = items.filter((item) => item.status === "pending");
      if (pendingItems.length > 0 && pendingItems[0].gcode) {
        setCurrentQueueGcode(pendingItems[0].gcode);
        setIsSerialLogOpen(true);
      }

      await processQueue();
      toast.success("Queue processing started");
      setIsProcessing(true);
    } catch (error) {
      console.error("Error processing queue:", error);
      toast.error("Failed to start queue processing");
    }
  };

  // Handle process next (first pending item only)
  const handleProcessNext = async () => {
    try {
      const result = await processNextInQueue();

      if (result.success && result.item) {
        setCurrentQueueGcode(result.item.gcode);
        setIsSerialLogOpen(true);
        toast.success("Drawing next item...");
      }
    } catch (error) {
      console.error("Error processing next item:", error);
      toast.error(error.message || "Failed to process next item");
    }
  };

  // Handle clear all
  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear the entire queue?")) {
      return;
    }

    try {
      await clearQueue();
      toast.success("Queue cleared");
      // fetchQueue will be called by socket event
    } catch (error) {
      console.error("Error clearing queue:", error);
      toast.error("Failed to clear queue");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full p-8 overflow-auto bg-base-100">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-full">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-8 overflow-auto bg-base-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-primary/20">
          <div className="w-1 h-8 bg-primary rounded-full"></div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Queue Manager
          </h2>
        </div>

        {/* Controls */}
        <QueueControls
          queueStats={stats}
          onProcess={handleProcess}
          onProcessNext={handleProcessNext}
          onClear={handleClear}
          isProcessing={isProcessing}
        />

        {/* Queue List */}
        <div className="bg-base-200 rounded-2xl p-6 shadow-xl border border-base-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-primary/20">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="text-xl font-bold">Queue Items</h3>
            <span className="badge badge-primary">{items.length}</span>
          </div>

          <QueueList
            items={items}
            onDelete={handleDelete}
            onReorder={fetchQueue}
          />
        </div>

        {/* Help Info */}
        {items.length === 0 && (
          <div className="alert alert-info">
            <AlertCircle className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">How to use the Queue:</h4>
              <ol className="text-sm list-decimal list-inside mt-2 space-y-1">
                <li>Go to Image or Text Mode and generate G-code</li>
                <li>Click "Add to Queue" in the preview modal</li>
                <li>Come back here and reorder items by dragging</li>
                <li>
                  Click "Process Queue" to start drawing all items sequentially
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Serial Log Modal */}
      <SerialLogModal
        isOpen={isSerialLogOpen}
        onClose={() => setIsSerialLogOpen(false)}
        gcode={currentQueueGcode}
        port="COM4"
      />
    </div>
  );
};

export default QueuePage;
