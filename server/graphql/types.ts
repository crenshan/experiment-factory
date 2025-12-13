export interface NextContext {
  params: Promise<Record<string, string>>;
}

export type Viewer = {
  uid: string;
  email?: string | null;
};

export type GraphQLContext = {
  viewer: Viewer | null;
};

export type SchemaContext = NextContext & GraphQLContext;
