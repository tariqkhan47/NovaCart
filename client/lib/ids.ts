// MySQL primary keys are auto-increment integers, unlike Mongo's ObjectId
// strings — route params still arrive as strings off the URL, so this is
// the equivalent "is this even a possible id" guard the routes used to run
// via mongoose.Types.ObjectId.isValid.
export function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
