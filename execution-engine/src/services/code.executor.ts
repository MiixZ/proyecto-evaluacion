import { getDockerClient } from "../config/docker.config";
import { TestCase, TestResult } from "../types/execution.types";
import * as fs from "fs/promises";
import * as path from "path";
import { PassThrough } from "stream";
import * as os from "os";

export class CodeExecutor {
  private docker = getDockerClient();

  // 🔥 USAR DIRECTORIO TEMPORAL DEL SISTEMA
  private readonly SANDBOX_BASE_DIR = path.join(
    os.tmpdir(),
    "execution-sandbox"
  );

  async executeCode(
    sandboxImage: string,
    code: string,
    testCase: TestCase,
    language: string,
    executionId: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    const workDir = path.join(this.SANDBOX_BASE_DIR, executionId);

    try {
      await fs.mkdir(workDir, { recursive: true });

      const codeFilename = this.getCodeFilename(language);
      await fs.writeFile(path.join(workDir, codeFilename), code, "utf-8");
      await fs.writeFile(
        path.join(workDir, "input.txt"),
        testCase.input,
        "utf-8"
      );

      console.log(`  📝 Preparado: ${workDir}`);

      // Verificar archivos
      const files = await fs.readdir(workDir);
      console.log(`  📄 Archivos creados: ${files.join(", ")}`);

      const command = this.getExecutionCommand(language, codeFilename);

      const output = await this.runDockerContainer(
        sandboxImage,
        command,
        workDir,
        testCase.timeLimit * 1000,
        testCase.memoryLimit
      );

      const executionTime = Date.now() - startTime;

      const actualOutput = output.trim();
      const expectedOutput = testCase.expectedOutput.trim();
      const passed = actualOutput === expectedOutput;

      console.log(
        `  ${passed ? "✅" : "❌"} Esperado: "${expectedOutput}" | Obtenido: "${actualOutput}"`
      );

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

      if (
        error.message.includes("timeout") ||
        error.message.includes("killed")
      ) {
        return {
          testCaseId: testCase.id,
          status: "timeout",
          expectedOutput: testCase.expectedOutput,
          actualOutput: "",
          executionTime,
          memoryUsed: 0,
          errorMessage: "Tiempo de ejecución excedido",
        };
      }

      return {
        testCaseId: testCase.id,
        status: "error",
        expectedOutput: testCase.expectedOutput,
        actualOutput: "",
        executionTime,
        memoryUsed: 0,
        errorMessage: error.message,
      };
    } finally {
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch (e) {
        // Ignorar
      }
    }
  }

  private async runDockerContainer(
    image: string,
    command: string[],
    workDir: string,
    timeoutMs: number,
    memoryLimitMb: number
  ): Promise<string> {
    const outputChunks: Buffer[] = [];
    const outputStream = new PassThrough();

    outputStream.on("data", (chunk: Buffer) => {
      outputChunks.push(chunk);
    });

    // 🔥 En Windows, normalizar la ruta para Docker Desktop
    const normalizedWorkDir = workDir.replace(/\\/g, "/");

    console.log(`  🐳 Montando: ${normalizedWorkDir} -> /workspace`);

    const createOptions = {
      Entrypoint: [],

      HostConfig: {
        Binds: [`${normalizedWorkDir}:/workspace:rw`],
        Memory: memoryLimitMb * 1024 * 1024,
        MemorySwap: memoryLimitMb * 1024 * 1024,
        CpuShares: 1024,
        NetworkMode: "none",
        AutoRemove: true,
        CapDrop: ["ALL"],
      },
      WorkingDir: "/workspace",
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
