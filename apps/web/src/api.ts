import type {
  ApiErrorResponse,
  HealthResponse,
  QueryResponse,
  RetrievalFilters,
  SourcesResponse
} from "@healthwise/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type QueryRequest = {
  query: string;
  filters?: RetrievalFilters;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("/health", { signal });
}

export async function getSources(signal?: AbortSignal): Promise<SourcesResponse> {
  return request<SourcesResponse>("/sources", { signal });
}

export async function askQuestion(
  payload: QueryRequest,
  signal?: AbortSignal
): Promise<QueryResponse> {
  return request<QueryResponse>("/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new ApiClientError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      response.status
    );
  }

  return (await response.json()) as T;
}

async function readErrorBody(response: Response): Promise<ApiErrorResponse | undefined> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return undefined;
  }
}
