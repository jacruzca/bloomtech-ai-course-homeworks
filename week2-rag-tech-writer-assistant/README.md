Based on the code changes and commit messages provided in the pull request, here is the updated README content reflecting the changes made in the code. The changes primarily focus on the implementation of a tech writer assistant that utilizes OpenAI's GPT model to help update README files based on code changes.

```markdown
# Week 2 - Session 1 - Tech Writer Assistant

This is the homework for Week 2, Session 1. The goal is to implement a tech writer assistant that leverages Langsmith and OpenAI's GPT model to assist in updating README files based on code changes.

## Overview

The tech writer assistant analyzes pull requests, including their code changes and commit messages. It then generates updated README content by considering the context and related issues, ensuring clarity and maintaining the existing style of the README.

## Features

- **Integration with GitHub**: The assistant retrieves information about pull requests, including file diffs and commit messages.
- **OpenAI Integration**: It uses OpenAI's GPT model to generate meaningful updates to the README based on the analysis of the changes made in the code.
- **Linear Issue Tracking**: The assistant can fetch related issues from Linear, helping to provide context for the changes.

## Usage

1. **Setup Environment Variables**:
   Ensure you have the following environment variables set:
   - `OWNER`: The GitHub repository owner's username.
   - `REPO`: The name of the GitHub repository.
   - `PULL_REQUEST_NUMBER`: The pull request number to analyze.
   - `MY_GITHUB_TOKEN`: GitHub personal access token.
   - `LINEAR_API_KEY`: API key for Linear.

2. **Run the Assistant**:
   Execute the script to analyze the pull request and generate README updates:
   ```bash
   node src/app.js
   ```

3. **Review and Merge Updates**:
   After running the assistant, a new pull request will be created with the updated README files based on the changes in the analyzed pull request.

## Code Structure

- **src/app.ts**: The main application logic for running the tech writer assistant.
- **src/ai-util.ts**: Contains utility functions for interacting with the OpenAI model.
- **src/github-util.ts**: Functions for interacting with the GitHub API to fetch pull request data.
- **src/linear-util.ts**: Functions for interacting with the Linear API to fetch issues.
- **README.md**: Documentation for the project.

## Commit Messages

The following commit messages were included in this pull request:
- tech-writer-progress
- RAG
- create pull request with changes
- github action
- allow manual triggering of action

## Acknowledgments

This project is part of the coursework for the tech writer assistant implementation using Langsmith and OpenAI technologies.
```

This updated README now reflects the functionality introduced in the code, including the purpose, features, and usage of the tech writer assistant tool, while maintaining clarity and consistency.