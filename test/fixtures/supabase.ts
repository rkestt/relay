import { vi, type Mock } from "vitest";

interface MockQueryBuilder {
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  eq: Mock;
  single: Mock;
  maybeSingle: Mock;
  order: Mock;
  limit: Mock;
  _resolve: (value: unknown) => MockQueryBuilder;
}

interface MockChannel {
  on: Mock;
  subscribe: Mock;
}

interface MockSupabaseClient {
  auth: {
    getUser: Mock;
    getSession: Mock;
  };
  from: Mock;
  channel: Mock;
  removeChannel: Mock;
  storage: {
    from: Mock;
  };
}

/**
 * Builder per creare un mock di Supabase client.
 */
export function createMockSupabaseClient(overrides: {
  auth?: {
    getUser?: Mock;
    getSession?: Mock;
  };
  from?: Record<string, Partial<MockQueryBuilder>>;
  channel?: Partial<MockChannel>;
  removeChannel?: Mock;
} = {}): {
  client: MockSupabaseClient;
  queryBuilder: MockQueryBuilder;
  channel: MockChannel;
} {
  const mockQueryBuilder: MockQueryBuilder = {
    select: vi.fn(() => mockQueryBuilder),
    insert: vi.fn(() => mockQueryBuilder),
    update: vi.fn(() => mockQueryBuilder),
    delete: vi.fn(() => mockQueryBuilder),
    eq: vi.fn(() => mockQueryBuilder),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    order: vi.fn(() => mockQueryBuilder),
    limit: vi.fn(() => mockQueryBuilder),
    _resolve: (value: unknown) => {
      mockQueryBuilder.single.mockResolvedValue(value);
      mockQueryBuilder.maybeSingle.mockResolvedValue(value);
      return mockQueryBuilder;
    },
  };

  const mockChannel: MockChannel = {
    on: vi.fn(() => mockChannel),
    subscribe: vi.fn((cb: (status: string) => void) => {
      cb("SUBSCRIBED");
      return mockChannel;
    }),
    ...overrides.channel,
  };

  const mockFrom = vi.fn((table: string) => {
    const tableOverrides = overrides.from?.[table] ?? {};
    return {
      ...mockQueryBuilder,
      ...tableOverrides,
    };
  });

  const mockClient: MockSupabaseClient = {
    auth: {
      getUser: overrides.auth?.getUser ?? vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: overrides.auth?.getSession ?? vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    from: mockFrom,
    channel: vi.fn(() => mockChannel),
    removeChannel: overrides.removeChannel ?? vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: "test.jpg" }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/test.jpg" } })),
      })),
    },
  };

  return {
    client: mockClient,
    queryBuilder: mockQueryBuilder,
    channel: mockChannel,
  };
}

export type { MockQueryBuilder, MockChannel, MockSupabaseClient };
