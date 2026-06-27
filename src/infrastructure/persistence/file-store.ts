import { promises as fs } from 'fs';
import path from 'path';

export class FileStore {
  constructor(private readonly baseDir: string) {}

  private resolve(filename: string): string {
    return path.join(this.baseDir, filename);
  }

  async ensureDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async read<T>(filename: string, fallback: T): Promise<T> {
    await this.ensureDir();
    const filePath = this.resolve(filename);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
  }

  async write<T>(filename: string, data: T): Promise<void> {
    await this.ensureDir();
    const filePath = this.resolve(filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
