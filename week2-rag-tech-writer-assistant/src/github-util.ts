import _ from "lodash";
import { Octokit } from "octokit";
import path from "path";

const getOctokit = () => {
  const octokit = new Octokit({ auth: process.env.MY_GITHUB_TOKEN });
  return octokit;
};

/**
 * Represents a file diff in a pull request, including the filename and the patch.
 */
export type Diff = {
  filename: string;
  patch: string | undefined;
};

/**
 * Get the list of files modified in a pull request.
 * @param owner - The repository owner.
 * @param repo - The repository name.
 * @param pullNumber - The pull request number.
 * @returns Array of files changed in the pull request.
 */
export const getDiffFilesOfPullRequest = async (
  owner: string,
  repo: string,
  number: number
): Promise<Diff[]> => {
  const octokit = getOctokit();

  const { data: diffs, status } = await octokit.rest.pulls.listFiles({
    owner: owner,
    repo: repo,
    pull_number: number,
  });

  if (status !== 200) {
    throw new Error("Pull request files not found");
  }

  const diffList: Diff[] = diffs.map((diff) => ({
    filename: diff.filename,
    patch: diff.patch,
  }));

  return diffList;
};

type ReadmeContentsAndRelatedFiles = {
  contents: string;
  diffs: Diff[];
};

type ReadmeFileAndAdjacentFilesMap = Map<string, ReadmeContentsAndRelatedFiles>;

/**
 * Finds adjacent README.md files for each file in the given diff.
 *
 * For each file in the diff, this function checks for README.md files in both the file's directory
 * and its parent directory. It returns a map where the keys are paths to README.md files, and the
 * values are arrays of files that are adjacent (located in the same or parent directory).
 *
 * @param {Diff[]} diff - An array of file diffs, each representing a file changed in the pull request,
 *                        including the filename and an optional patch.
 * @param {string} owner - The owner of the GitHub repository.
 * @param {string} repo - The name of the GitHub repository.
 * @returns {Promise<ReadmeFileAndAdjacentFilesMap>} A Promise that resolves to a Map where the keys are
 *                                           README.md file paths, and the values are arrays of adjacent files.
 *
 * Usage example:
 * const diffs = await getDiffFilesOfPullRequest('octocat', 'Hello-World', 123);
 * const adjacentReadmes = await findAdjacentReadmeFilesFromDiff(diffs, 'octocat', 'Hello-World');
 */
export const findAdjacentReadmeFilesFromDiff = async (
  diff: Diff[],
  owner: string,
  repo: string
): Promise<ReadmeFileAndAdjacentFilesMap> => {
  const octokit = getOctokit();

  const readmeFilesForDiff = await Promise.all(
    diff.map(async (fileDiff) => {
      const filePath = fileDiff.filename;

      // Get the directory of the file
      const fileDirectory = path.dirname(filePath);

      // Check if there is a README.md in the current directory
      const currentDirReadme = await findReadmeInDirectory(
        owner,
        repo,
        fileDirectory,
        octokit
      );

      // Check if there is a README.md in the parent directory
      const parentDir = path.dirname(fileDirectory);
      const parentDirReadme = await findReadmeInDirectory(
        owner,
        repo,
        parentDir,
        octokit
      );

      const decodedContent = currentDirReadme?.contents || "";

      return {
        diff: fileDiff,
        contents: decodedContent,
        adjacentReadmeFiles: _.uniq([
          ...(currentDirReadme?.path ? [currentDirReadme.path] : []),
          ...(parentDirReadme?.path ? [parentDirReadme.path] : []),
        ]),
      };
    })
  );

  // make a dictionary of unique adjacent README files and for each one, have the list of diff that are adjacent to it
  const readmeFilesMap: ReadmeFileAndAdjacentFilesMap = new Map<
    string,
    ReadmeContentsAndRelatedFiles
  >();
  readmeFilesForDiff.forEach((readmeFile) => {
    readmeFile.adjacentReadmeFiles.forEach(async (readmePath) => {
      if (!readmeFilesMap.has(readmePath)) {
        readmeFilesMap.set(readmePath, {
          contents: "",
          diffs: [],
        });
      }

      const existingValue = readmeFilesMap.get(readmePath);
      if (existingValue) {
        existingValue.contents = readmeFile.contents || "";
        existingValue.diffs.push(readmeFile.diff);
        readmeFilesMap.set(readmePath, existingValue);
      }
    });
  });
  return readmeFilesMap;
};

/**
 * Searches for a README.md file in a specified directory of a GitHub repository.
 * If found, it retrieves and decodes the content of the README file.
 *
 * @param {string} owner - The owner of the GitHub repository.
 * @param {string} repo - The name of the GitHub repository.
 * @param {string} directory - The directory path to search for the README.md file.
 * @param {Octokit} octokit - An authenticated Octokit instance for making GitHub API calls.
 * @returns {Promise<{ path: string; contents?: string } | null>} A promise that resolves to an object
 *          containing the path and decoded contents of the README file if found, or null if not found.
 * @throws {Error} Throws an error if there's an issue with the API call (except for 404 errors).
 */
const findReadmeInDirectory = async (
  owner: string,
  repo: string,
  directory: string,
  octokit: Octokit
): Promise<{ path: string; contents?: string } | null> => {
  try {
    // Fetch the contents of the specified directory
    const { data: contents } = await octokit.rest.repos.getContent({
      owner: owner,
      repo: repo,
      path: directory,
    });

    // Check if the response is an array (directory listing)
    if (Array.isArray(contents)) {
      // Look for a file named README.md (case-insensitive)
      const readmeFile = contents.find(
        (item) =>
          item.type === "file" && item.name.toLowerCase() === "readme.md"
      );

      if (readmeFile) {
        // If README is found but content is not included in the initial response
        if (!readmeFile.content) {
          // Make an additional API call to fetch the file content
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner: owner,
            repo: repo,
            path: readmeFile.path,
          });

          // Ensure the response contains the content field
          if ("content" in fileData) {
            readmeFile.content = fileData.content;
          }
        }

        // Decode the Base64 encoded content
        const decodedContent = readmeFile.content
          ? atob(readmeFile.content)
          : "";

        // Return the path and decoded contents
        return {
          path: readmeFile.path,
          contents: decodedContent,
        };
      }
    }
  } catch (error) {
    // Ignore 404 errors (file or directory not found)
    if (error.status !== 404) {
      console.error("Error fetching directory contents:", error);
      throw error; // Re-throw non-404 errors
    }
  }

  // Return null if no README.md is found
  return null;
};

export const getPullRequest = async (
  owner: string,
  repo: string,
  number: number
) => {
  const octokit = getOctokit();
  const { data: pr } = await octokit.rest.pulls.get({
    owner: owner,
    repo: repo,
    pull_number: number,
  });
  return pr;
};

export const getCommitMessagesOfPullRequest = async (
  owner: string,
  repo: string,
  number: number
) => {
  const octokit = getOctokit();
  const { data: commits } = await octokit.rest.pulls.listCommits({
    owner: owner,
    repo: repo,
    pull_number: number,
  });

  const commitList = commits.map((commit) => ({
    message: commit.commit.message,
  }));

  return commitList;
};

/**
 * Creates a new pull request based on the main branch, with updated README files.
 *
 * This function:
 * - Creates a new branch from the main branch.
 * - Updates the README files with new content.
 * - Commits the changes to the new branch.
 * - Opens a new pull request.
 *
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @param {number} number - The pull request number to base the new pull request message on.
 * @param {Map<string, string>} results - A map of README file paths and their updated content.
 *    - The keys are the paths to the README files.
 *    - The values are the updated content for each README file.
 * @returns {Promise<void>} - A promise that resolves when the new pull request is successfully created.
 *
 * @throws {Error} - Throws an error if the pull request or file update fails.
 *
 * Usage example:
 *
 * const updatedReadmeMap = new Map([
 *   ['README.md', '# Updated README content'],
 *   ['docs/README.md', '# Updated Docs README content']
 * ]);
 *
 * await createPullRequest('my-owner', 'my-repo', 42, updatedReadmeMap);
 */
export const createPullRequest = async (
  owner: string,
  repo: string,
  number: number,
  results: Map<string, string>
): Promise<void> => {
  const octokit = getOctokit();

  // Get the latest commit SHA from the main branch
  const { data: mainBranch } = await octokit.rest.repos.getBranch({
    owner: owner,
    repo: repo,
    branch: "main",
  });

  const newBranch = `update-readme-${Date.now()}`;

  // Create a new branch from the main branch
  await octokit.rest.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${newBranch}`,
    sha: mainBranch.commit.sha, // Use the latest commit SHA from the main branch
  });

  // For each README file, update the content and create a new commit
  for (const [readmePath, updatedContent] of results.entries()) {
    // Get the current README file information (sha is needed to update the file)
    const { data: readmeFile } = await octokit.rest.repos.getContent({
      owner: owner,
      repo: repo,
      path: readmePath,
      ref: newBranch,
    });

    // Ensure the response contains the content field
    // types of octokit are a mess, so we need to check if the content field is present
    if ("content" in readmeFile) {
      // Update the README file with the new content
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: owner,
        repo: repo,
        path: readmePath,
        message: `Update README file at ${readmePath}`,
        content: Buffer.from(updatedContent).toString("base64"), // GitHub expects content in base64
        sha: readmeFile.sha, // required to update the file
        branch: newBranch,
      });
    }
  }

  // Create a new pull request
  await octokit.rest.pulls.create({
    owner: owner,
    repo: repo,
    title: `Update README files`,
    head: newBranch,
    base: "main", // Now the base is the main branch
    body: `This pull request updates the README files based on the changes in pull request #${number}.`,
  });

  console.log(`New pull request created successfully from PR #${number}`);
};
