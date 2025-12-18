import express from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const router = express.Router();

let activePort = null;
let parser = null;
let isConnected = false;
let persistentPort = null; // For manual control persistent connection
let persistentParser = null;
let persistentConnected = false;

/**
 * POST /api/serial/send
 * Send G-code to Arduino via serial with real-time updates using SSE
 */
router.post("/send", async (req, res) => {
  const { gcode, port = "/dev/ttyUSB0", baudRate = 115200 } = req.body;

  if (!gcode) {
    return res.status(400).json({ error: "No G-code provided" });
  }

  // Set headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Close existing connection if any
    if (activePort && activePort.isOpen) {
      console.log("Closing existing port connection...");
      await new Promise((resolve) => {
        activePort.close((err) => {
          if (err) console.error("Error closing port:", err);
          resolve();
        });
      });
      activePort = null;
      parser = null;
      isConnected = false;
      
      // Wait a bit after closing before reopening
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Create new serial port connection
    // NOTE: Try to prevent DTR reset (may not work on all systems)
    activePort = new SerialPort({
      path: port,
      baudRate: baudRate,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      flowControl: false,
      autoOpen: false,
    });

    parser = activePort.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    const startTime = Date.now();

    // Setup event listeners
    activePort.on("open", () => {
      console.log(`Serial port ${port} opened successfully`);
      isConnected = true;
      
      // Try to disable DTR/RTS (may not work on all systems)
      try {
        activePort.set({ dtr: false, rts: false }, (err) => {
          if (err) console.log("Note: Could not set DTR/RTS:", err.message);
          else console.log("DTR/RTS disabled successfully");
        });
      } catch (e) {
        console.log("Note: DTR/RTS control not available on this system");
      }

      sendEvent("status", {
        message: "Connected to Arduino",
        timestamp: Date.now() - startTime,
      });

      // Wait for GRBL to initialize and settle
      // GRBL typically takes 1-2 seconds after power-on
      setTimeout(() => {
        sendEvent("status", {
          message: "GRBL ready, starting transmission...",
          timestamp: Date.now() - startTime,
        });
        sendGcodeLinesSSE(gcode, activePort, parser, startTime, res, sendEvent);
      }, 3000); // Increased to 3 seconds for better stability
    });

    activePort.on("error", (err) => {
      console.error("Serial port error:", err);
      isConnected = false;
      sendEvent("error", {
        message: err.message,
        timestamp: Date.now() - startTime,
      });
      res.end();
    });

    // Open the port manually
    activePort.open((err) => {
      if (err) {
        console.error("Error opening port:", err);
        sendEvent("error", { message: err.message, timestamp: 0 });
        res.end();
      }
    });
  } catch (error) {
    console.error("Error opening serial port:", error);
    sendEvent("error", { message: error.message, timestamp: 0 });
    res.end();
  }
});

/**
 * Send G-code lines one by one with SSE updates
 */
function sendGcodeLinesSSE(gcode, port, parser, startTime, res, sendEvent) {
  const lines = gcode
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith(";"));

  let currentLine = 0;
  let waitingForResponse = false;
  let responseTimeout = null;
  const RESPONSE_TIMEOUT = 3000; // Reduced to 3 seconds (from 5) for faster recovery
  let grblInitialized = false; // Track if GRBL startup is complete
  let transmissionStarted = false; // Track if we've started sending G-code
  let consecutiveTimeouts = 0; // Track consecutive timeouts
  const MAX_CONSECUTIVE_TIMEOUTS = 5; // Stop after 5 consecutive timeouts

  parser.on("data", (data) => {
    const response = data.trim();
    
    // Detect corrupted data (contains non-printable characters or excessive special chars)
    const corruptionIndicators = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]|[\?]{3,}/;
    if (corruptionIndicators.test(response) && response.length > 20) {
      console.error(`⚠️ CORRUPTED DATA DETECTED: ${response.substring(0, 50)}...`);
      sendEvent("log", {
        timestamp: Date.now() - startTime,
        message: "⚠️ WARNING: Data corruption detected - Check USB cable!",
        line: currentLine,
      });
      // Don't process this line, wait for next response
      return;
    }

    console.log(`Arduino: ${response}`);

    // Clear timeout since we got a response
    if (responseTimeout) {
      clearTimeout(responseTimeout);
      responseTimeout = null;
    }
    
    // Reset consecutive timeout counter on successful response
    consecutiveTimeouts = 0;

    // Send real-time log to frontend
    sendEvent("log", {
      timestamp: Date.now() - startTime,
      message: response,
      line: currentLine,
    });

    // Detect GRBL initialization (ignore first startup message)
    if (response.includes("Grbl") && response.includes("['$' for help]")) {
      if (!grblInitialized) {
        // This is the expected startup message
        console.log("GRBL initialized");
        grblInitialized = true;
        return; // Don't treat as error
      } else if (transmissionStarted) {
        // This is an unexpected reset during transmission
        console.error("⚠️ GRBL RESET DETECTED - Continuing anyway (CHECK USB CABLE!)");
        sendEvent("log", {
          message: "⚠️ WARNING: GRBL reset detected - Check USB cable! Attempting to continue...",
          timestamp: Date.now() - startTime,
        });
        // Reset state and try to continue
        grblInitialized = true;
        waitingForResponse = false;
        // Don't close port, try to recover
        return;
      }
    }

    // Check for GRBL errors
    if (response.toLowerCase().startsWith("error:")) {
      console.error(`GRBL Error: ${response}`);
      sendEvent("error", {
        message: `GRBL Error: ${response}`,
        timestamp: Date.now() - startTime,
      });
      // Continue anyway - some errors are non-fatal
    }

    // Arduino is ready for next command
    if (
      response.toLowerCase().includes("ok") ||
      response.toLowerCase().includes("done")
    ) {
      waitingForResponse = false;
      sendNextLine();
    }
  });

  function sendNextLine() {
    if (currentLine >= lines.length) {
      // All lines sent
      const endTime = Date.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`G-code transmission complete in ${totalTime} seconds`);

      sendEvent("complete", {
        totalLines: lines.length,
        totalTime: totalTime + " seconds",
        timestamp: endTime - startTime,
      });

      // Clear any pending timeout
      if (responseTimeout) {
        clearTimeout(responseTimeout);
      }

      // Close port after completion
      setTimeout(() => {
        if (port && port.isOpen) {
          port.close();
        }
        res.end();
      }, 1000);

      return;
    }

    if (!waitingForResponse) {
      const line = lines[currentLine];
      console.log(`Sending [${currentLine + 1}/${lines.length}]: ${line}`);

      // Mark that we've started transmission (for reset detection)
      if (!transmissionStarted) {
        transmissionStarted = true;
      }

      // Send progress update
      sendEvent("progress", {
        current: currentLine + 1,
        total: lines.length,
        line: line,
        timestamp: Date.now() - startTime,
      });

      port.write(line + "\n", (err) => {
        if (err) {
          console.error("Error writing to serial port:", err);
          sendEvent("error", {
            message: err.message,
            timestamp: Date.now() - startTime,
          });
          res.end();
        } else {
          // Ensure data is actually transmitted before continuing
          port.drain((drainErr) => {
            if (drainErr) {
              console.error("Error draining port:", drainErr);
            }
          });
        }
      });

      waitingForResponse = true;
      currentLine++;

      // Set timeout for this command
      responseTimeout = setTimeout(() => {
        consecutiveTimeouts++;
        console.error(`⚠️ Timeout ${consecutiveTimeouts}/${MAX_CONSECUTIVE_TIMEOUTS} waiting for response to line ${currentLine}`);
        
        if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
          // Too many timeouts, likely Arduino is dead
          sendEvent("error", {
            message: `Critical: ${MAX_CONSECUTIVE_TIMEOUTS} consecutive timeouts - Arduino may be frozen. Check hardware!`,
            timestamp: Date.now() - startTime,
          });
          if (port && port.isOpen) {
            port.close();
          }
          res.end();
          return;
        }
        
        sendEvent("log", {
          message: `⚠️ Timeout on line ${currentLine} - Continuing... (Check USB cable!)`,
          timestamp: Date.now() - startTime,
        });
        
        // Try to continue anyway
        waitingForResponse = false;
        sendNextLine();
      }, RESPONSE_TIMEOUT);
    }
  }

  // Start sending
  sendNextLine();
}

/**
 * GET /api/serial/ports
 * List available serial ports
 */
router.get("/ports", async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json({
      success: true,
      ports: ports.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        vendorId: port.vendorId,
        productId: port.productId,
      })),
    });
  } catch (error) {
    console.error("Error listing serial ports:", error);
    res.status(500).json({
      success: false,
      error: "Failed to list serial ports",
      message: error.message,
    });
  }
});

/**
 * GET /api/serial/status
 * Get current serial connection status
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    connected: persistentConnected || isConnected,
    port: persistentPort ? persistentPort.path : (activePort ? activePort.path : null),
    isOpen: persistentPort ? persistentPort.isOpen : (activePort ? activePort.isOpen : false),
  });
});

/**
 * POST /api/serial/connect
 * Open a persistent serial connection for manual control
 */
router.post("/connect", async (req, res) => {
  try {
    const { port = "/dev/ttyUSB0", baudRate = 115200 } = req.body;

    // Close existing persistent connection if any
    if (persistentPort && persistentPort.isOpen) {
      console.log("Closing existing persistent connection...");
      await new Promise((resolve) => {
        persistentPort.close((err) => {
          if (err) console.error("Error closing port:", err);
          resolve();
        });
      });
      persistentPort = null;
      persistentParser = null;
      persistentConnected = false;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`Opening persistent connection to ${port}`);

    // Create persistent serial port
    persistentPort = new SerialPort({
      path: port,
      baudRate: baudRate,
      autoOpen: false,
    });

    persistentParser = persistentPort.pipe(new ReadlineParser({ delimiter: "\r\n" }));

    // Setup event listeners
    persistentPort.on("error", (err) => {
      console.error("Persistent port error:", err);
      persistentConnected = false;
    });

    // Open port
    await new Promise((resolve, reject) => {
      persistentPort.open((err) => {
        if (err) {
          reject(err);
        } else {
          // Try to disable DTR/RTS
          try {
            persistentPort.set({ dtr: false, rts: false }, (setErr) => {
              if (setErr) console.log("Note: Could not set DTR/RTS:", setErr.message);
            });
          } catch (e) {
            console.log("Note: DTR/RTS control not available");
          }
          resolve();
        }
      });
    });

    console.log(`Persistent port ${port} opened successfully`);
    persistentConnected = true;

    // Wait for GRBL to initialize
    await new Promise((resolve) => setTimeout(resolve, 2500));

    res.json({
      success: true,
      message: "Persistent connection established",
      port: port,
    });
  } catch (error) {
    console.error("Error opening persistent connection:", error);
    persistentConnected = false;
    res.status(500).json({
      success: false,
      error: error.message || "Failed to open persistent connection",
    });
  }
});

/**
 * POST /api/serial/disconnect
 * Close the persistent serial connection
 */
router.post("/disconnect", async (req, res) => {
  try {
    if (persistentPort && persistentPort.isOpen) {
      await new Promise((resolve) => {
        persistentPort.close((err) => {
          if (err) console.error("Error closing port:", err);
          resolve();
        });
      });
      persistentPort = null;
      persistentParser = null;
      persistentConnected = false;
      
      res.json({
        success: true,
        message: "Persistent connection closed",
      });
    } else {
      res.json({
        success: true,
        message: "No active persistent connection",
      });
    }
  } catch (error) {
    console.error("Error closing persistent connection:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to close connection",
    });
  }
});

/**
 * POST /api/serial/command
 * Send a single command to Arduino (uses persistent connection if available)
 */
router.post("/command", async (req, res) => {
  try {
    const { command, port = "/dev/ttyUSB0", baudRate = 115200, usePersistent = true } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: "Command is required",
      });
    }

    // Try to use persistent connection first
    if (usePersistent && persistentPort && persistentPort.isOpen && persistentConnected) {
      console.log(`Sending command via persistent connection: ${command}`);

      const responses = [];
      let responseReceived = false;

      // Set up temporary listener for this command
      const dataHandler = (data) => {
        const trimmedData = data.trim();
        console.log(`Arduino response: ${trimmedData}`);
        responses.push(trimmedData);
        responseReceived = true;
      };

      persistentParser.on("data", dataHandler);

      // Send command
      await new Promise((resolve, reject) => {
        persistentPort.write(command + "\n", (err) => {
          if (err) {
            console.error("Write error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Ensure data is transmitted
      await new Promise((resolve) => {
        persistentPort.drain((err) => {
          if (err) console.error("Drain error:", err);
          resolve();
        });
      });

      // Wait for response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Remove listener
      persistentParser.off("data", dataHandler);

      const arduinoResponse = responses.join(" ");

      return res.json({
        success: true,
        message: `Command sent: ${command}`,
        response: arduinoResponse || "ok",
        responses: responses.length > 0 ? responses : ["ok"],
        persistent: true,
      });
    }

    // Fall back to temporary connection if no persistent connection
    console.log(`Attempting to send command to ${port}: ${command}`);

    // Create temporary serial connection
    // Prevent DTR reset
    const serialPort = new SerialPort({
      path: port,
      baudRate: baudRate,
      autoOpen: false,
      hupcl: false,
      lock: false,
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    let arduinoResponse = "";
    const responses = [];

    // Listen for Arduino response
    parser.on("data", (data) => {
      const trimmedData = data.trim();
      console.log(`Arduino response: ${trimmedData}`);
      responses.push(trimmedData);
      arduinoResponse += trimmedData + " ";
    });

    // Open port
    await new Promise((resolve, reject) => {
      serialPort.open((err) => {
        if (err) reject(err);
        else {
          // Disable DTR to prevent reset
          serialPort.set({ dtr: false, rts: false }, (setErr) => {
            if (setErr) console.error("Error setting DTR/RTS:", setErr);
          });
          resolve();
        }
      });
    });

    console.log(`Port ${port} opened successfully`);

    // Wait for Arduino to initialize (GRBL needs time after reset)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send command
    console.log(`Writing command: ${command}`);
    await new Promise((resolve, reject) => {
      serialPort.write(command + "\n", (err) => {
        if (err) {
          console.error("Write error:", err);
          reject(err);
        } else {
          console.log("Command written successfully");
          resolve();
        }
      });
    });

    // Wait for response
    console.log("Waiting for response...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Close port
    await new Promise((resolve) => {
      serialPort.close((err) => {
        if (err) console.error("Error closing port:", err);
        resolve();
      });
    });

    console.log(`Total responses received: ${responses.length}`);
    console.log(`Combined response: ${arduinoResponse}`);

    res.json({
      success: true,
      message: `Command sent: ${command}`,
      response: arduinoResponse.trim() || "No response received",
      responses: responses,
    });
  } catch (error) {
    console.error("Error sending command:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send command",
    });
  }
});

export default router;
