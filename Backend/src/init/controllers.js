import exampleController from "../controllers/cncController.js";
import imageController from "../controllers/imageController.js";
import serialController from "../controllers/serialController.js";
import queueController from "../controllers/queueController.js";
import fontController from "../controllers/fontController.js";
import textController from "../controllers/textController.js";

export default function initControllers(app) {
  app.use("/api/cnc", exampleController);
  app.use("/api/image", imageController);
  app.use("/api/serial", serialController);
  app.use("/api/queue", queueController);
  app.use("/api/fonts", fontController);
  app.use("/api/text", textController);
}
