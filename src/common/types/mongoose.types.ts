import 'mongoose';

declare module 'mongoose' {
  // Add $locals to query middleware

  interface Query<
    ResultType,
    DocType,
    THelpers = {},
    RawDocType = unknown,
    QueryOp = 'find',
    TDocOverrides = Record<string, never>,
  > {
    $locals: Record<string, unknown>;
  }

  interface Document {
    $locals: Record<string, unknown>;
  }
}
