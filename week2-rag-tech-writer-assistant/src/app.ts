// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import {
  createPullRequest,
  findAdjacentReadmeFilesFromDiff,
  getCommitMessagesOfPullRequest,
  getDiffFilesOfPullRequest,
} from "./github-util";
import { buildDocumentsForVectorStore, callOpenAI } from "./ai-util";
import { getAllLinearIssues, getLinearIssueByUrl } from "./linear-util";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
dotenv.config();

const OWNER = process.env.OWNER;
const REPO = process.env.REPO;
const PULL_REQUEST_NUMBER = parseInt(process.env.PULL_REQUEST_NUMBER ?? "0");

export const run = async () => {
  if (!OWNER || !REPO || !PULL_REQUEST_NUMBER) {
    throw new Error("Missing environment variables");
  }

  const diffFiles = await getDiffFilesOfPullRequest(
    OWNER,
    REPO,
    PULL_REQUEST_NUMBER
  );

  const commitMessages = await getCommitMessagesOfPullRequest(
    OWNER,
    REPO,
    PULL_REQUEST_NUMBER
  );

  const adjacentReadme = await findAdjacentReadmeFilesFromDiff(
    diffFiles,
    OWNER,
    REPO
  );

  const issue = await getLinearIssueByUrl(
    "https://linear.app/jhon-cruz/issue/JHO-10/issue-with-project-1"
  );

  const allIssues = await getAllLinearIssues();

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });

  const vectorStore = new MemoryVectorStore(embeddings);

  const documents = buildDocumentsForVectorStore(allIssues);

  await vectorStore.addDocuments(documents);

  const results = new Map<string, string>();

  for (const [key, value] of adjacentReadme.entries()) {
    const res = await callOpenAI({
      diffFiles: value.diffs,
      commitMessages: commitMessages.map((commit) => commit.message),
      adjacentFilesToReadme: value.diffs.map((diff) => diff.filename),
      readmeContents: value.contents,
      vectorStoreInput: `Give me a list of issues related to this PR: ${issue.title}`,
      vectorStore,
    });

    const resultAsString = res.toDict().data.content;

    results.set(key, resultAsString);

    console.log(`Result for ${key}: ${resultAsString}`);
  }

  await createPullRequest(OWNER, REPO, PULL_REQUEST_NUMBER, results);
};

// Call the run function with the desired number of conversation turns
run(); // Replace 5 with the desired number of turns
