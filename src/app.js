const express = require("express");

const app = express();

app.use(express.json());

const ENVIRONMENT = process.env.ENVIRONMENT || "dev";

app.get("/", (req, res) => {
    res.json({
        message: "CI/CD GKE Demo Application",
        version: "1.0.0",
        environment: ENVIRONMENT
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy"
    });
});

app.get("/ready", (req, res) => {
    res.status(200).json({
        status: "ready"
    });
});

app.get("/api/info", (req, res) => {
    res.json({
        application: "ci-cd-gke-task",
        environment: ENVIRONMENT
    });
});

module.exports = app;