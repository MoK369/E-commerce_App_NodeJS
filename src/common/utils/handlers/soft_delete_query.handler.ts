import type { Query } from "mongoose";

const softDeleteQueryFunction = function (
  doc: Query<any, any, {}, unknown, "find", Record<string, never>>
) {
  const query = doc.getQuery();
  if (query.paranoid === false) {
    doc.setQuery({ ...query });
  } else {
    doc.setQuery({ ...query, freezedAt: { $exists: false } });
  }
};

export default softDeleteQueryFunction;