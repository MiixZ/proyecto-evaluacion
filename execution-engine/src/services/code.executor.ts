import { getDockerClient } from "../config/docker.config";
import { TestCase, TestResult } from "../types/execution.types";
import * as fs from "fs/promises";
import * as path from "path";

export class CodeExecutor {
  private docker = getDockerClient();

  private readonly INTERNAL_DIR = "/app/sandbox_data";

  private readonly SHARED_VOLUME =
    process.env.SANDBOX_VOLUME_NAME || "evaluacion-shared-vol";

  private readonly STUDENT_CODE_MARKER = "{{STUDENT_CODE}}";

  private readonly SANDBOX_MOUNT_POINT = "/sandbox_drive";

  async executeCode(
    sandboxImage: string,
    code: string,
    testCase: TestCase,
    language: string,
    executionId: string,
  ): Promise<TestResult> {
    const startTime = Date.now();
    const executionDir = path.join(this.INTERNAL_DIR, executionId);

    try {
      await fs.mkdir(executionDir, { recursive: true });
      await fs.chmod(executionDir, 0o777);

      const codeFilename = this.getCodeFilename(language);

      let finalCode = code;
      if (
        testCase.runnerCode &&
        testCase.runnerCode.includes(this.STUDENT_CODE_MARKER)
      ) {
        finalCode = testCase.runnerCode.replace(this.STUDENT_CODE_MARKER, code);
        console.log(
          `  📦 Usando runner_code con sustitución de código del estudiante`,
        );
      }

      await fs.writeFile(
        path.join(executionDir, codeFilename),
        finalCode,
        "utf-8",
      );
      await fs.writeFile(
        path.join(executionDir, "input.txt"),
        testCase.input,
        "utf-8",
      );

      await fs.chmod(path.join(executionDir, codeFilename), 0o777);
      await fs.chmod(path.join(executionDir, "input.txt"), 0o777);

      console.log(`Archivos escritos en: ${executionDir}`);

      const command = this.getExecutionCommand(language, codeFilename);

      const output = await this.runDockerContainer(
        sandboxImage,
        command,
        executionId,
        testCase.timeLimit * 1000,
        testCase.memoryLimit,
      );

      const executionTime = Date.now() - startTime;
      const actualOutput = output.trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      console.log(`  ${passed ? "✅" : "❌"} Test ${testCase.id}`);

      return {
        testCaseId: testCase.id,
        status: passed ? "passed" : "failed",
        expectedOutput,
        actualOutput,
        executionTime,
        memoryUsed: 0,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error(`  ❌ Error: ${error.message}`);

      let status: "timeout" | "error" = "error";
      let errorMessage = error.message;

      if (
        error.message.includes("timeout") ||
        error.message.includes("killed")
      ) {
        status = "timeout";
        errorMessage = "Tiempo de ejecución excedido";
      }

      return {
        testCaseId: testCase.id,
        status,
        expectedOutput: testCase.expectedOutput,
        actualOutput: "",
        executionTime,
        memoryUsed: 0,
        errorMessage,
      };
    } finally {
      try {
        await fs.rm(executionDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Error limpieza:", e);
      }
    }
  }

  private async runDockerContainer(
    image: string,
    command: string[],
    executionId: string,
    timeoutMs: number,
    memoryLimitMb: number,
  ): Promise<string> {
    const sandboxWorkDir = path.posix.join(
      this.SANDBOX_MOUNT_POINT,
      executionId,
    );

    // Configuración del contenedor
    const createOptions = {
      Image: image,
      Cmd: command,
      Entrypoint: [],
      HostConfig: {
        Binds: [`${this.SHARED_VOLUME}:${this.SANDBOX_MOUNT_POINT}:rw`],
        Memory: memoryLimitMb * 1024 * 1024,
        MemorySwap: memoryLimitMb * 1024 * 1024,
        CpuShares: 1024,
        NetworkMode: "none",
        AutoRemove: false,
        CapDrop: ["ALL"],
      },
      WorkingDir: sandboxWorkDir,
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
    };

    let container: any = null;

    try {
      container = await this.docker.createContainer(createOptions);

      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });

      const outputChunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => outputChunks.push(chunk));

      await container.start();

      await new Promise<void>((resolve, reject) => {
        let finished = false;

        container
          .wait()
          .then(() => {
            if (!finished) {
              finished = true;
              resolve();
            }
          })
          .catch((err: any) => {
            if (!finished) {
              finished = true;
              reject(err);
            }
          });

        setTimeout(async () => {
          if (!finished) {
            finished = true;
            console.log(`  ⏱️ Matando contenedor por timeout: ${executionId}`);
            try {
              await container.kill();
            } catch (e) {
              // Ignorar error
            }
            reject(new Error("timeout"));
          }
        }, timeoutMs);
      });

      // Procesar salida
      const fullOutput = Buffer.concat(outputChunks).toString("utf-8");
      return this.cleanDockerOutput(fullOutput);
    } finally {
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (e) {
          // Ignorar error
        }
      }
    }
  }
  private cleanDockerOutput(rawOutput: string): string {
    const lines = rawOutput.split("\n");
    const cleaned = lines
      .map((line) => {
        if (line.length > 8) {
          const firstByte = line.charCodeAt(0);
          if (firstByte === 1 || firstByte === 2) {
            return line.substring(8);
          }
        }

        return line;
      })
      .filter((line) => {
        const text = line.trim();
        if (!text) return false;
        if (text.startsWith("Picked up JAVA_TOOL_OPTIONS:")) return false;
        return true;
      });

    return cleaned.join("\n").trim();
  }

  private getExecutionCommand(language: string, filename: string): string[] {
    const commands: Record<string, string[]> = {
      python: ["sh", "-c", `cat input.txt | python3 ${filename}`],
      java: ["sh", "-c", `javac ${filename} && cat input.txt | java Solution`],
      javascript: ["sh", "-c", `cat input.txt | node ${filename}`],
      cpp: [
        "sh",
        "-c",
        `g++ -o solution ${filename} && cat input.txt | ./solution`,
      ],
    };

    return commands[language] || commands["python"]!;
  }

  private getCodeFilename(language: string): string {
    const extensions: Record<string, string> = {
      python: "solution.py",
      java: "Solution.java",
      javascript: "solution.js",
      cpp: "solution.cpp",
    };

    return extensions[language] || "solution.py";
  }
}
