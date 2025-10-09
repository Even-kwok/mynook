declare module '@supabase/supabase-js' {
  export interface AuthError {
    message: string;
    status?: number;
    name?: string;
  }

  export interface User {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface Session {
    access_token: string;
    refresh_token?: string | null;
    expires_in?: number;
    token_type?: string;
    user: User | null;
    [key: string]: unknown;
  }

  export interface AuthResponse<T> {
    data: T | null;
    error: AuthError | null;
  }

  export interface AuthSessionResponse {
    data: { session: Session | null };
    error: AuthError | null;
  }

  export interface AuthUserResponse {
    data: { user: User | null };
    error: AuthError | null;
  }

  export interface OAuthResponse {
    data: { provider?: string; url?: string | null };
    error: AuthError | null;
  }

  export interface AuthSubscription {
    data: {
      subscription: {
        unsubscribe(): void;
      };
    };
  }

  export interface SignUpWithPasswordCredentials {
    email: string;
    password: string;
    options?: Record<string, unknown>;
  }

  export interface SignInWithPasswordCredentials {
    email: string;
    password: string;
  }

  export interface SignInWithOAuthCredentials {
    provider: string;
    options?: Record<string, unknown>;
  }

  export interface SupabaseAuthClient {
    signUp(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse<{ user: User | null; session: Session | null }>>;
    signInWithPassword(credentials: SignInWithPasswordCredentials): Promise<AuthResponse<{ user: User | null; session: Session | null }>>;
    signInWithOAuth(credentials: SignInWithOAuthCredentials): Promise<OAuthResponse>;
    signOut(): Promise<{ error: AuthError | null }>;
    getSession(): Promise<AuthSessionResponse>;
    getUser(): Promise<AuthUserResponse>;
    onAuthStateChange(callback: (event: string, session: Session | null) => void): AuthSubscription;
  }

  export interface QueryBuilder<Result = unknown> {
    select(columns?: string): Promise<{ data: Result; error: Error | null }>;
    insert(values: unknown, options?: Record<string, unknown>): Promise<{ data: Result; error: Error | null }>;
    upsert(values: unknown, options?: Record<string, unknown>): Promise<{ data: Result; error: Error | null }>;
    update(values: unknown, options?: Record<string, unknown>): Promise<{ data: Result; error: Error | null }>;
    delete(options?: Record<string, unknown>): Promise<{ data: Result; error: Error | null }>;
    eq(column: string, value: unknown): QueryBuilder<Result>;
    order(column: string, options?: Record<string, unknown>): QueryBuilder<Result>;
    limit(count: number): QueryBuilder<Result>;
    single(): Promise<{ data: Result; error: Error | null }>;
  }

  export interface StorageBucketApi {
    upload(path: string, file: Blob | File, options?: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }>;
    download(path: string): Promise<{ data: Blob | null; error: Error | null }>;
    remove(paths: string[]): Promise<{ data: unknown; error: Error | null }>;
    list(path?: string, options?: Record<string, unknown>): Promise<{ data: unknown; error: Error | null }>;
    getPublicUrl(path: string): { data: { publicUrl: string } };
  }

  export interface StorageClient {
    from(bucket: string): StorageBucketApi;
  }

  export interface SupabaseClient<Database = unknown> {
    auth: SupabaseAuthClient;
    from<TableName extends string, Result = unknown>(table: TableName): QueryBuilder<Result>;
    storage: StorageClient;
  }

  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
      storage?: Storage;
    };
    global?: {
      headers?: Record<string, string>;
    };
  }

  export function createClient<Database = unknown>(
    url: string,
    key: string,
    options?: SupabaseClientOptions
  ): SupabaseClient<Database>;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.75.0?bundle' {
  export * from '@supabase/supabase-js';
}

