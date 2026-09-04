import express, { Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { 
  passport_callback, 
  oauth2Callback, 
  CardDAVAuth,
  csrfTokenMiddleware,
  createCSRFToken
} from "./auth.js";

// === CONSTANTS ===
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;
const AUTH_RATE_LIMIT_MAX = 5;
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
];
const BODY_SIZE_LIMIT = "10mb";

const app: Express = express();

// === SECURITY HEADERS ===
app.use(helmet());

// === COOKIE PARSING ===
app.use(cookieParser());

// === CORS WITH WHITELIST ===
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);

// === RATE LIMITING ===
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  message: "Too many login attempts",
});

app.use(limiter);

// === BODY PARSING ===
app.use(express.json({ limit: BODY_SIZE_LIMIT }));
app.use(express.urlencoded({ limit: BODY_SIZE_LIMIT, extended: true }));

// === AUTH MIDDLEWARE ===
app.use(passport_callback);
app.use(csrfTokenMiddleware);

// === ROUTES ===

// Health Check (no auth required)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// CSRF Token endpoint - provides token for form submissions
app.get("/api/csrf-token", (_req, res) => {
  const token = createCSRFToken();
  res.json({ csrfToken: token });
});

// OAuth2 Callback with auth rate limiting and CSRF
app.post("/oauth2/callback", authLimiter, oauth2Callback);

// Protected routes
app.get("/addressbook", CardDAVAuth, (_req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "forbidden",
      message: "CORS policy violation",
    });
  }

  res.status(500).json({
    error: "internal_server_error",
    message: "An unexpected error occurred",
  });
});

export default app;
