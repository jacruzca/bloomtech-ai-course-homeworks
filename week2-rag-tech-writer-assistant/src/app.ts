// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import {
  createPullRequest,
  findAdjacentReadmeFilesFromDiff,
  getCommitMessagesOfPullRequest,
  getDiffFilesOfPullRequest,
  getPullRequest,
} from "./github-util";
import { buildDocumentsForVectorStore, callOpenAI } from "./ai-util";
import { getAllLinearIssues } from "./linear-util";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

dotenv.config();

// Constants derived from environment variables
// Make sure to set them in github secrets as well
const OWNER = process.env.OWNER;
const REPO = process.env.REPO;
const PULL_REQUEST_NUMBER = parseInt(process.env.PULL_REQUEST_NUMBER ?? "0");

/**
 * Main function to run the pull request processing pipeline.
 * Fetches pull request data, builds vector store embeddings, and interacts with OpenAI to analyze related issues.
 */
export const run = async () => {
  // Ensure required environment variables are present
  if (!OWNER || !REPO || !PULL_REQUEST_NUMBER) {
    throw new Error("Missing environment variables");
  }

  // Get files that were changed in the pull request
  const diffFiles = await getDiffFilesOfPullRequest(
    OWNER,
    REPO,
    PULL_REQUEST_NUMBER
  );

  // Get commit messages related to the pull request
  const commitMessages = await getCommitMessagesOfPullRequest(
    OWNER,
    REPO,
    PULL_REQUEST_NUMBER
  );

  // Find README files adjacent to the modified files
  const adjacentReadme = await findAdjacentReadmeFilesFromDiff(
    diffFiles,
    OWNER,
    REPO
  );

  // Fetch pull request details
  const pullRequest = await getPullRequest(OWNER, REPO, PULL_REQUEST_NUMBER);

  // Fetch all issues from the Linear API
  const allIssues = await getAllLinearIssues();

  // Set up OpenAI embeddings for the vector store
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  // Initialize in-memory vector store
  const vectorStore = new MemoryVectorStore(embeddings);

  // Build documents for the vector store using all Linear issues
  const documents = buildDocumentsForVectorStore(allIssues);

  // Add documents to the vector store
  await vectorStore.addDocuments(documents);

  const results = new Map<string, string>();

  // Loop through each README file adjacent to the modified files
  for (const [key, value] of adjacentReadme.entries()) {
    // Call OpenAI to analyze the context of the pull request and adjacent README
    const res = await callOpenAI({
      diffFiles: value.diffs,
      commitMessages: commitMessages.map((commit) => commit.message),
      adjacentFilesToReadme: value.diffs.map((diff) => diff.filename),
      readmeContents: value.contents,
      vectorStoreInput: `Give me a list of issues related to this PR. Title: ${pullRequest.title} \n Description: ${pullRequest.body}`,
      vectorStore,
    });

    // Convert the response to a string
    const resultAsString = res.toDict().data.content;

    // Store the result for the current README file
    results.set(key, resultAsString);

    // Log the result for the current file
    console.log(`Result for ${key}: ${resultAsString}`);
  }

  // Create a new pull request with the results
  await createPullRequest(OWNER, REPO, PULL_REQUEST_NUMBER, results);
};

// Run the main function
run();
