import express from "express";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const router = express.Router();

let serialPort = null;
let parser = null;

/**
 * POST /api/serial/send
 * Send G-code to Arduino via serial with real-time updates using SSE
 */
router.post("/send", async (req, res) => {
  const { gcode, port = "COM4", baudRate = 115200 } = req.body;

  if (!gcode) {
    return res.status(400).json({ error: "No G-code provided" });
  }

  // Set headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Open serial port
    serialPort = new SerialPort({
      path: port,
      baudRate: baudRate,
      dataBits: 8,
      parity: "none",
      stopBits: 1,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    // Send connection status
    res.write(
      `event: status\ndata: ${JSON.stringify({
        message: "Connected to Arduino",
        timestamp: Date.now(),
      })}\n\n`
    );

    // Wait for Arduino to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const lines = gcode.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(";");
    });

    let currentLine = 0;

    // Send G-code line by line
    for (const line of lines) {
      await sendLine(line, parser, serialPort);
      currentLine++;

      // Send progress update
      res.write(
        `event: progress\ndata: ${JSON.stringify({
          current: currentLine,
          total: lines.length,
          line: line.trim(),
          timestamp: Date.now(),
        })}\n\n`
      );
    }

    // Send completion event
    res.write(
      `event: complete\ndata: ${JSON.stringify({
        totalLines: lines.length,
        message: "G-code sent successfully",
        timestamp: Date.now(),
      })}\n\n`
    );

    // Close the connection
    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
    res.end();
  } catch (error) {
    console.error("Serial communication error:", error);

    res.write(
      `event: error\ndata: ${JSON.stringify({
        message: error.message,
        timestamp: Date.now(),
      })}\n\n`
    );

    if (serialPort && serialPort.isOpen) {
      serialPort.close();
    }
    res.end();
  }
});

/**
 * Send a single line of G-code and wait for "ok" response
 * @param {string} line - G-code line
 * @param {ReadlineParser} parser - Serial parser
 * @param {SerialPort} port - Serial port
 * @returns {Promise}
 */
function sendLine(line, parser, port) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timeout waiting for Arduino response"));
    }, 5000);

    const onData = (data) => {
      const response = data.toString().trim().toLowerCase();
      if (response.includes("ok") || response.includes("done")) {
        clearTimeout(timeout);
        parser.removeListener("data", onData);
        resolve();
      }
    };

    parser.on("data", onData);

    port.write(line + "\n", (err) => {
      if (err) {
        clearTimeout(timeout);
        parser.removeListener("data", onData);
        reject(err);
      }
    });
  });
}

/**
 * GET /api/serial/ports
 * List available serial ports
 */
router.get("/ports", async (req, res) => {
  try {
    const ports = await SerialPort.list();
    res.json({ ports });
  } catch (error) {
    console.error("Error listing serial ports:", error);
    res.status(500).json({
      error: "Failed to list serial ports",
      message: error.message,
    });
  }
});

/**
 * GET /api/serial/status
 * Check serial connection status
 */
router.get("/status", (req, res) => {
  res.json({
    connected: serialPort !== null,
    port: serialPort?.path || null,
    isOpen: serialPort?.isOpen || false,
  });
});

export default router;
