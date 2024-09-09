import { LinearClient } from "@linear/sdk";
import { get } from "lodash";

const getLinearClient = async () => {
  const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
  return linear;
};

/**
 * Example URL: https://linear.app/jhon-cruz/issue/JHO-10/issue-with-project-1
 * Result: JHO-10
 * @param url
 * @returns the linear ID from the URL
 */
const getLinearIdFromUrl = (url: string) => {
  const parts = url.split("/");
  return parts[parts.length - 2];
};

export const getLinearIssueByUrl = async (url: string) => {
  const client = await getLinearClient();
  const issueId = getLinearIdFromUrl(url);
  if (!issueId) {
    throw new Error("Invalid issue URL");
  }
  const issue = await client.issue(issueId);
  return issue;
};
