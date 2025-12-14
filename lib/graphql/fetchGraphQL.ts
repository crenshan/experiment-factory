type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function fetchGraphQL<TData, TVars extends Record<string, unknown> | undefined>({
  query, variables, token
}: {
  query: string;
  variables?: TVars;
  token?: string;
}) {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  const json = (await res.json()) as GraphQLResponse<TData>;

  if (json.errors?.length) {
    throw new Error(json.errors.map(e => e.message).join('; '));
  }

  if (!json.data) {
    throw new Error('No data returned from GraphQL');
  }

  return json.data
}
