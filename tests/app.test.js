const request = require("supertest");
const app = require("../src/app");

describe("CI/CD GKE Demo API", () => {

    test("GET / should return application information", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe("CI/CD GKE Demo Application");
        expect(response.body.environment).toBe("dev");
    });

    test("GET /health should return healthy status", async () => {
        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("healthy");
    });

    test("GET /ready should return ready status", async () => {
        const response = await request(app).get("/ready");

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe("ready");
    });

    test("GET /api/info should return application information", async () => {
        const response = await request(app).get("/api/info");

        expect(response.statusCode).toBe(200);
        expect(response.body.application).toBe("ci-cd-gke-task");
        expect(response.body.environment).toBe("dev");
    });

});