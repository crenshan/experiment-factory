export interface NextContext {
  params: Promise<Record<string, string>>;
}

export type Viewer = {
  uid: string;
  email?: string | null;
};

export type GraphQLContext = {
  viewer: Viewer | null;

  // uid if signed in, else anon cookie
  userKey: string | null;
};

export type SchemaContext = NextContext & GraphQLContext;
