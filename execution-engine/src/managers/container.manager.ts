import Docker, { Container } from "dockerode";
import { DOCKER_CONFIG, getDockerClient } from "../config/docker.config";

export class ContainerManager {
  private docker: Docker;
  private activeContainers: Map<string, string> = new Map();

  constructor() {
    this.docker = getDockerClient();
  }

  async createSandboxContainer(
    language: string,
    executionId: string
  ): Promise<Container> {
    const containerName = `sandbox-${executionId}-${Date.now()}`;

    const imageName = this.getImageForLanguage(language);

    console.log(
      `🐳 Creando contenedor: ${containerName} (imagen: ${imageName})`
    );

    try {
      const container = await this.docker.createContainer({
        Image: imageName,
        name: containerName,

        HostConfig: {
          // CPU: límite de 1 core
          CpuShares: 1024,
          CpuPeriod: 100000,
          CpuQuota: 100000,

          // Memoria: 512MB
          Memory: 512 * 1024 * 1024,
          MemorySwap: 512 * 1024 * 1024,

          // Procesos
          PidsLimit: 100,

          // Red
          NetworkMode: DOCKER_CONFIG.network,

          // Seguridad
          ReadonlyRootfs: false,
          CapDrop: ["ALL"],
          CapAdd: ["NET_BIND_SERVICE"],
        },

        // Volúmenes
        Volumes: {
          "/workspace": {},
        },

        // Variables de entorno
        Env: [`EXECUTION_ID=${executionId}`, "PYTHONUNBUFFERED=1"],

        // Labels para tracking
        Labels: {
          type: "sandbox",
          executionId: executionId,
          createdAt: new Date().toISOString(),
        },
      });

      this.activeContainers.set(executionId, container.id);
      return container;
    } catch (error) {
      console.error(`❌ Error creando contenedor ${containerName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create sandbox container: ${errorMessage}`);
    }
  }

  /**
   * Destruir contenedor (limpiar después de ejecución)
   */
  async destroySandboxContainer(executionId: string): Promise<void> {
    const containerId = this.activeContainers.get(executionId);

    if (!containerId) {
      console.warn(`⚠️  No container found for execution ${executionId}`);
      return;
    }

    try {
      const container = this.docker.getContainer(containerId);

      console.log(`🗑️  Destruyendo contenedor: ${containerId}`);

      try {
        await container.stop({ t: 5 });
      } catch (e) {
        // Ya está parado
      }

      // Eliminar
      await container.remove();

      this.activeContainers.delete(executionId);
      console.log(`✅ Contenedor destruido: ${containerId}`);
    } catch (error) {
      console.error(`❌ Error destruyendo contenedor ${containerId}:`, error);
      // No lanzar error, continuar con limpieza
    }
  }

  private getImageForLanguage(language: string): string {
    const images: Record<string, string> = {
      python: DOCKER_CONFIG.sandboxImages.python,
      java: DOCKER_CONFIG.sandboxImages.java,
      javascript: DOCKER_CONFIG.sandboxImages.javascript,
      cpp: DOCKER_CONFIG.sandboxImages.cpp,
    };

    return images[language] || DOCKER_CONFIG.sandboxImages.python;
  }

  /**
   * Limpiar contenedores huérfanos
   */
  async cleanupOrphanedContainers(): Promise<void> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ["type=sandbox"],
        },
      });

      const now = Date.now();
      const CONTAINER_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

      for (const containerInfo of containers) {
        const createdAtLabel = containerInfo.Labels?.["createdAt"];
        if (!createdAtLabel) continue;

        const createdAt = new Date(createdAtLabel).getTime();
        const age = now - createdAt;

        if (age > CONTAINER_MAX_AGE_MS) {
          console.log(`🧹 Limpiando contenedor antiguo: ${containerInfo.Id}`);
          const container = this.docker.getContainer(containerInfo.Id);

          try {
            await container.stop({ t: 5 });
            await container.remove();
          } catch (e) {
            console.warn(
              `⚠️  No se pudo limpiar contenedor ${containerInfo.Id}`
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Error limpiando contenedores:", error);
    }
  }
}
