// Load environment variables (populate process.env from .env file)
import * as dotenv from "dotenv";
import { Endpoints } from "@octokit/types";
import {
  findAdjacentReadmeFilesFromDiff,
  getCommitMessagesOfPullRequest,
  getDiffFilesOfPullRequest,
} from "./github-util";
import { buildPromptForASingleReadmeFile, callOpenAI } from "./ai-util";
import { getLinearIssueByUrl } from "./linear-util";
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

  const res = await getLinearIssueByUrl(
    "https://linear.app/jhon-cruz/issue/JHO-10/issue-with-project-1"
  );

  console.log("res", res);

  // for (const [key, value] of adjacentReadme.entries()) {
  //   const prompt = await buildPromptForASingleReadmeFile(
  //     value.diffs,
  //     commitMessages.map((commit) => commit.message),
  //     value.diffs.map((diff) => diff.filename),
  //     value.contents
  //   );

  //   const res = await callOpenAI(prompt);
  //   console.log("rest: " + key, res);
  // }
};

// Call the run function with the desired number of conversation turns
run(); // Replace 5 with the desired number of turns
