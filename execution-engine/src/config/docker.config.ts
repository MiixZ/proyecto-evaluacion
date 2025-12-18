import Docker from "dockerode";

export const DOCKER_CONFIG = {
  // Docker socket connection
  socketPath: process.env.DOCKER_SOCKET || "/var/run/docker.sock",

  // Network configuration
  network: process.env.SANDBOX_NETWORK || "evaluacion-net",

  // Container limits
  maxConcurrentContainers: parseInt(
    process.env.MAX_CONCURRENT_CONTAINERS || "10"
  ),
  containerTimeoutSeconds: parseInt(
    process.env.CONTAINER_TIMEOUT_SECONDS || "30"
  ),

  // Image names
  sandboxImages: {
    python: "evaluacion-sandbox-python:latest",
    java: "evaluacion-sandbox-java:latest",
    javascript: "evaluacion-sandbox-js:latest",
    cpp: "evaluacion-sandbox-cpp:latest",
  },
};

export const getDockerClient = (): Docker => {
  return new Docker({
    socketPath: DOCKER_CONFIG.socketPath,
  });
};
