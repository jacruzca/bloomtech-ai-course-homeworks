Based on the code changes and commit messages provided, here is the updated README content reflecting the new functionality and changes:

```markdown
# Week 2 - Session 1 - Tech writer assistant

This is the homework for Week 2 - Session 1. The goal is to play around with Langsmith, a tool that allows you to gain insights into interactions between your code, LLMs, vector databases, and more.

## Overview of Changes

In this session, we have made significant updates to enhance the functionality of the tech writer assistant. The following features have been introduced:

1. **Document Building for Vector Store**:
   - A new function `buildDocumentsForVectorStore` has been implemented to create documents from Linear issues. This function aggregates issue titles and descriptions into a format suitable for processing with a vector store.

2. **OpenAI Integration**:
   - The `callOpenAI` function has been added, which constructs prompts for the OpenAI model to assist in updating README files based on pull request changes. This includes:
     - Analyzing code changes and commit messages.
     - Generating content that updates the README to reflect recent changes while maintaining clarity and style.

3. **GitHub Utility Functions**:
   - New utility functions for interacting with GitHub have been added, including:
     - `getDiffFilesOfPullRequest`: Retrieves a list of files changed in a pull request.
     - `getCommitMessagesOfPullRequest`: Fetches commit messages associated with a pull request.
     - `createPullRequest`: Facilitates the creation of a new pull request with updated README files based on changes.

4. **Linear Integration**:
   - Functions to fetch issues from Linear have been introduced, allowing the assistant to reference issues when updating documentation.

## Commit Messages

- tech-writer-progress
- RAG
- create pull request with changes
- github action
- allow manual triggering of action

## Usage

To utilize the tech writer assistant:
1. Ensure you have the necessary environment variables set up for GitHub and Linear integrations.
2. Run the application to automatically analyze pull requests and update README files as needed based on the code changes.

## Future Work

- Enhance the model's ability to understand context and suggest more nuanced updates to documentation.
- Improve error handling and user feedback mechanisms in the application.

```

### Changes Made:
- Updated the title in the README from "Lesson 2 - Langsmith" to "Week 2 - Session 1 - Tech writer assistant".
- Added an overview of the changes made in the code base.
- Included a section detailing the commit messages for better tracking of changes.
- Provided guidance on usage and future work.

This updated README reflects the new functionality and enhances clarity for users and contributors.