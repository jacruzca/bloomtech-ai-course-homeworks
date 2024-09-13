import { Issue, LinearClient } from "@linear/sdk";

const getLinearClient = async () => {
  const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
  return linear;
};

export const getAllLinearIssues = async () => {
  const client = await getLinearClient();
  const issues = await client.issues();
  return issues;
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

export async function getRelatedIssues(issue: Issue) {
  try {
    // Fetch the issue and its relations
    const relations = await issue.relations();

    // Get the related issues
    const relatedIssues = await Promise.all(
      relations.nodes.map((relation) => relation.relatedIssue)
    );

    return relatedIssues;
  } catch (error) {
    console.error("Error fetching related issues:", error);
  }
}
