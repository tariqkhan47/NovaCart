import { randomBytes } from "node:crypto";

/** Secret that stands in for the email address in an unsubscribe link. */
export function newUnsubscribeToken() {
  return randomBytes(16).toString("hex");
}
