import exampleController from "../controllers/cncController.js";
import imageController from "../controllers/imageController.js";
import serialController from "../controllers/serialController.js";

export default function initControllers(app) {
  app.use("/api/cnc", exampleController);
  app.use("/api/image", imageController);
  app.use("/api/serial", serialController);
}
