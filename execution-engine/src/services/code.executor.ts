import { getDockerClient } from "../config/docker.config";
import { TestCase, TestResult } from "../types/execution.types";
import * as fs from "fs/promises";
import * as path from "path";
import { PassThrough } from "stream";

export class CodeExecutor {
  private docker = getDockerClient();

  private readonly INTERNAL_DIR = "/app/sandbox_data";

  private readonly SHARED_VOLUME =
    process.env.SANDBOX_VOLUME_NAME || "evaluacion-shared-vol";

  private readonly SANDBOX_MOUNT_POINT = "/sandbox_drive";

  async executeCode(
    sandboxImage: string,
    code: string,
    testCase: TestCase,
    language: string,
    executionId: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    const executionDir = path.join(this.INTERNAL_DIR, executionId);

    try {
      await fs.mkdir(executionDir, { recursive: true });

      const codeFilename = this.getCodeFilename(language);

      // 2. Escribir archivos
      await fs.writeFile(path.join(executionDir, codeFilename), code, "utf-8");
      await fs.writeFile(
        path.join(executionDir, "input.txt"),
        testCase.input,
        "utf-8"
      );

      console.log(`  📝 Archivos escritos en: ${executionDir}`);

      const command = this.getExecutionCommand(language, codeFilename);

      const output = await this.runDockerContainer(
        sandboxImage,
        command,
        executionId,
        testCase.timeLimit * 1000,
        testCase.memoryLimit
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
    memoryLimitMb: number
  ): Promise<string> {
    const outputChunks: Buffer[] = [];
    const outputStream = new PassThrough();

    outputStream.on("data", (chunk: Buffer) => {
      outputChunks.push(chunk);
    });

    const sandboxWorkDir = path.posix.join(
      this.SANDBOX_MOUNT_POINT,
      executionId
    );

    console.log(`  🐳 Sandbox WorkingDir: ${sandboxWorkDir}`);

    const createOptions = {
      Entrypoint: [],
      HostConfig: {
        // Montamos el volumen compartido en /sandbox_drive
        Binds: [`${this.SHARED_VOLUME}:${this.SANDBOX_MOUNT_POINT}:ro`], // ro = read-only por seguridad extra

        Memory: memoryLimitMb * 1024 * 1024,
        MemorySwap: memoryLimitMb * 1024 * 1024,
        CpuShares: 1024,
        NetworkMode: "none",
        AutoRemove: true,
        CapDrop: ["ALL"],
      },
      WorkingDir: sandboxWorkDir,
      Tty: false,
    };

    return Promise.race([
      this.docker.run(image, command, outputStream, createOptions).then(() => {
        const fullOutput = Buffer.concat(outputChunks).toString("utf-8");
        return this.cleanDockerOutput(fullOutput);
      }),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
  }

  private cleanDockerOutput(rawOutput: string): string {
    const lines = rawOutput.split("\n");
    const cleaned = lines.map((line) => {
      if (line.length > 8) {
        const firstByte = line.charCodeAt(0);
        if (firstByte === 1 || firstByte === 2) {
          return line.substring(8);
        }
      }
      return line;
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
