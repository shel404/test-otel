const express = require("express");
const app = express();
const port = 3000;
const mongodb = require("mongodb");
const { trace, context } = require("@opentelemetry/api");

// Import and initialize OpenTelemetry
const configureOpenTelemetry = require("./tracing");
const sdk = require("./tracing");
const tracerProvider = configureOpenTelemetry("first-service");

const SERVICE_TRACER_NAME = "app-one-tracer";

app.use("/test", (req, res, next) => {
  const tracer = tracerProvider.getTracer(SERVICE_TRACER_NAME);
  const span = tracer.startSpan("/test");
  // Add custom attributes or log additional information if needed
  span.setAttribute("user", "user made");

  // Pass the span to the request object for use in the route handler
  context.with(trace.setSpan(context.active(), span), () => {
    next();
  });
});

app.get("/getuser", (req, res) => {
  // Get the tracer
  const tracer = tracerProvider.getTracer(SERVICE_TRACER_NAME);

  // Start a new span for the /getuser request
  const span = tracer.startSpan("/getuser");

  try {
    // Simulate some processing
    const user = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
    };

    // Add attributes to the span if needed
    span.setAttribute("user.id", user.id);
    span.setAttribute("user.name", user.name);

    // Send the user data as a JSON response
    res.json(user);
  } catch (error) {
    // Record the error in the span
    span.recordException(error);

    // Respond with an error status code
    res.status(500).send(error.message);
  } finally {
    // End the span
    span.end();
  }
});

app.get("/test", async (req, res) => {
  const tracer = tracerProvider.getTracer(SERVICE_TRACER_NAME);

  const span = trace.getSpan(context.active());

  span.setAttribute("time", new Date().toISOString());

  await otherService(span);

  const dbSpan = tracer.startSpan("mongo", {
    parent: span,
  });
  await connectMongo();
  dbSpan.end();

  res.json({ message: "Hello from app-one" });

  span.end();
});

const otherService = async (parentSpan) => {
  const tracer = tracerProvider.getTracer(SERVICE_TRACER_NAME);

  const span = tracer.startSpan("other-service", {
    parent: parentSpan,
  });
  await sleep(1000);
  await context.with(trace.setSpan(context.active(), span), async () => {
    await otherServiceSecond(span);
  });
  span.end();
};

const otherServiceSecond = async (parentSpan) => {
  const tracer = tracerProvider.getTracer(SERVICE_TRACER_NAME);

  const span = tracer.startSpan("other-service-2", {
    parent: parentSpan,
  });
  await sleep(1000);
  span.end();
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const connectMongo = async () => {
  const client = new mongodb.MongoClient(
    "mongodb+srv://shel404:shel404mongo@cluster0.6fh8nrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  );
  try {
    await client.connect();
  } catch (error) {
    console.log("error :", error);
  }
  const db = client.db("test");
  const collection = db.collection("test");

  const result = await collection.insertOne({ key: "value" });

  console.log(result);
};

// Gracefully shut down the OpenTelemetry SDK and the server
const gracefulShutdown = () => {
  server.close(() => {
    console.log("Server stopped");
    tracerProvider
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.error("Error shutting down tracing", error))
      .finally(() => process.exit(0));
  });
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
