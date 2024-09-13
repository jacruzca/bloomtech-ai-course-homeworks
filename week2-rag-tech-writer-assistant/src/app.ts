// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import { Endpoints } from "@octokit/types";
import {
  findAdjacentReadmeFilesFromDiff,
  getCommitMessagesOfPullRequest,
  getDiffFilesOfPullRequest,
} from "./github-util";
import {
  buildDocumentsForVectorStore,
  buildPromptForASingleReadmeFile,
  callOpenAI,
} from "./ai-util";
import {
  getAllLinearIssues,
  getLinearIssueByUrl,
  getRelatedIssues,
} from "./linear-util";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
dotenv.config();

type ContentParams =
  Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"]["data"];

const OWNER = "jacruzca";
const REPO = "bloomtech-ai-course-homeworks";
const PULL_REQUEST_NUMBER = 1;

export const run = async () => {
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

  for (const [key, value] of adjacentReadme.entries()) {
    const res = await callOpenAI({
      diffFiles: value.diffs,
      commitMessages: commitMessages.map((commit) => commit.message),
      adjacentFilesToReadme: value.diffs.map((diff) => diff.filename),
      readmeContents: value.contents,
      vectorStoreInput: `Give me a list of issues related to this PR: ${issue.title}`,
      vectorStore,
    });

    console.log("rest: " + key, res);
  }
};

// Call the run function with the desired number of conversation turns
run(); // Replace 5 with the desired number of turns
