import exampleController from "../controllers/cncController.js";

export default function initControllers(app) {
  app.use("/api/cnc", exampleController);

  
}
