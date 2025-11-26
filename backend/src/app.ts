import express from "express"
import cors, { CorsOptions } from "cors"
import helmet from "helmet"
import morgan from "morgan"
import compression from "compression"
import rateLimit from "express-rate-limit"
import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import dotenv from "dotenv"

import { errorHandler } from "@middleware/errorHandler.js"
import { notFoundHandler } from "@middleware/notFoundHandler.js"
import { logger } from "@utils/logger.js"

import graphRoutes from "@routes/graph.js"
import searchRoutes from "@routes/search.js"
import analyticsRoutes from "@routes/analytics.js"
import userRoutes from "@routes/users.js"
import { neo4jService } from "@services/neo4j.js"

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001
const API_PREFIX = process.env.API_PREFIX || "/api"

app.use(helmet())
app.use(compression())
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))

const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (configuredOrigins.includes(origin)) {
      return callback(null, true)
    }

    if (origin.endsWith(".vercel.app") || origin.endsWith(".netlify.app")) {
      return callback(null, true)
    }

    if (origin.startsWith("http://localhost:") || origin.startsWith("https://localhost:")) {
      return callback(null, true)
    }

    callback(new Error("Not allowed by CORS"))
  },
  credentials: process.env.CORS_CREDENTIALS === "true",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}

app.use(cors(corsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  standardHeaders: true,
  legacyHeaders: false
})

app.use(limiter)

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TCM Knowledge Graph API",
      version: "1.0.0",
      description: "REST APIs for the TCM Knowledge Graph backend"
    },
    servers: [
      {
        url: `http://localhost:${PORT}${API_PREFIX}`,
        description: "Development"
      }
    ]
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"]
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: neo4jService.isConnected() ? "connected" : "disconnected"
  })
})

app.get(`${API_PREFIX}/stats`, async (_req, res) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({ success: false, error: "Database not connected" })
    }

    const stats = await neo4jService.getStats()
    return res.json({ success: true, data: stats })
  } catch (error) {
    logger.error("Failed to load stats", error)
    return res.status(500).json({ success: false, error: "Failed to load stats" })
  }
})

app.get(`${API_PREFIX}/nodes/roots`, async (req, res) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({ success: false, error: "Database not connected" })
    }

    const limit = Number(req.query.limit) || 20
    const roots = await neo4jService.getRootNodes(limit)
    return res.json({ success: true, data: roots })
  } catch (error) {
    logger.error("Failed to load root nodes", error)
    return res.status(500).json({ success: false, error: "Failed to load root nodes" })
  }
})

app.get(`${API_PREFIX}/nodes/:code`, async (req, res) => {
  try {
    if (!neo4jService.isConnected()) {
      return res.status(503).json({ success: false, error: "Database not connected" })
    }

    const code = decodeURIComponent(req.params.code)
    const data = await neo4jService.getNodeDetails(code)
    return res.json({ success: true, data })
  } catch (error) {
    logger.error("Failed to load node detail", error)
    return res.status(500).json({ success: false, error: "Failed to load node detail" })
  }
})

app.use(`${API_PREFIX}/graph`, graphRoutes)
app.use(`${API_PREFIX}/search`, searchRoutes)
app.use(`${API_PREFIX}/analytics`, analyticsRoutes)
app.use(`${API_PREFIX}/users`, userRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  const connected = await neo4jService.connect()
  if (!connected) {
    logger.error("Unable to connect to Neo4j, exiting...")
    process.exit(1)
  }

  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`)
  })
}

if (process.env.NODE_ENV !== "test") {
  start().catch((error) => {
    logger.error("Server failed to start", error)
    process.exit(1)
  })
}

export { app }
export default app
