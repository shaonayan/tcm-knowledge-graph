import neo4j, { Driver, Session } from "neo4j-driver"
import { logger } from "../utils/logger.js"

const NEO4J_URI = process.env.NEO4J_URI || ""
const NEO4J_USER = process.env.NEO4J_USER || process.env.NEO4J_USERNAME || ""
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ""

let isConnected = false

export const driver: Driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  {
    maxConnectionLifetime: 60_000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 60_000
  }
)

export const verifyConnection = async (): Promise<void> => {
  try {
    await driver.verifyConnectivity()
    isConnected = true
    logger.info("�?Neo4j连接成功")
  } catch (error) {
    isConnected = false
    logger.error(`�?Neo4j连接失败: ${(error as Error).message}`)
  }
}

verifyConnection().catch((error) => logger.error(error))

export const markNeo4jStatus = (status: boolean) => {
  isConnected = status
}

export const getNeo4jStatus = () => isConnected

export const getSession = (): Session => driver.session()
