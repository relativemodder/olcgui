import { ApiError } from '../errors';
import { buildUrl } from './utils';
import { createAuthApi } from './auth';
import { createInstancesApi } from './instances';
import { createUsersApi } from './users';
import { createBuildsApi } from './builds';
import { createRepoApi } from './repo';
import { createSystemApi } from './system';

export { ApiError } from '../errors';

export interface ApiRequestOptions {
	body?: unknown;
	headers?: Record<string, string>;
	isFormData?: boolean;
	signal?: AbortSignal;
}

export type ApiRequest = <T>(method: string, path: string, opts?: ApiRequestOptions) => Promise<T>;

export class ApiClient {
	public auth: ReturnType<typeof createAuthApi>;
	public instances: ReturnType<typeof createInstancesApi>;
	public users: ReturnType<typeof createUsersApi>;
	public builds: ReturnType<typeof createBuildsApi>;
	public repo: ReturnType<typeof createRepoApi>;
	public system: ReturnType<typeof createSystemApi>;

	constructor(opts: { baseUrl: string; token?: string; fetch?: typeof fetch }) {
		const baseUrl = opts.baseUrl;
		const token = opts.token;
		const fetcher = opts.fetch ?? fetch;

		const request: ApiRequest = async <T>(
			method: string,
			path: string,
			options?: ApiRequestOptions
		): Promise<T> => {
			const url = buildUrl(baseUrl, path);
			const headers: Record<string, string> = {
				...(options?.headers ?? {})
			};

			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			if (options?.body !== undefined && !options?.isFormData) {
				headers['content-type'] = 'application/json';
			}

			const body = options?.isFormData
				? (options.body as FormData)
				: options?.body !== undefined
					? JSON.stringify(options.body)
					: undefined;

			const res = await fetcher(url, {
				method,
				headers,
				body,
				signal: options?.signal
			});

			if (!res.ok) {
				let message = `API request failed with ${res.status}`;
				try {
					const data = (await res.json()) as { error?: string };
					if (data.error) message = data.error;
				} catch {
					// keep fallback
				}
				throw new ApiError(res.status, message);
			}

			const text = await res.text();
			if (!text) return undefined as T;
			return JSON.parse(text) as T;
		};

		this.auth = createAuthApi(request);
		this.instances = createInstancesApi(request);
		this.users = createUsersApi(request);
		this.builds = createBuildsApi(request);
		this.repo = createRepoApi(request);
		this.system = createSystemApi(request);
	}
}
