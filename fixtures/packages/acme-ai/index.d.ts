export interface CompleteOptions {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export interface Completion {
  text: string;
}

export declare class OpenAI {
  complete(engine: string, options: CompleteOptions): Promise<Completion>;
  extract(input: string): Promise<Record<string, unknown>>;
}

export declare function stream(engine: string, options: CompleteOptions): AsyncIterable<string>;
export default OpenAI;
