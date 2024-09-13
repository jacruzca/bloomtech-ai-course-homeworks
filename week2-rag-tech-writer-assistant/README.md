Based on the provided code changes and commit messages, the README file should be updated to reflect the new functionality introduced in the project. Below is the suggested update for the README file:

```markdown
# Week 2 - Session 1 - Tech Writer Assistant

This is the homework for Week 2, Session 1. The goal is to play around with Langsmith, a tool that allows you to gain insights into interactions between your code, LLMs, vector databases, and more.

## Features Added

- **Issue Integration:** The project now integrates with Linear to fetch issues, allowing for better documentation based on user-reported issues. The integration includes fetching details such as issue titles and descriptions, which are transformed into documents for further processing.

- **Vector Store Utilization:** The project utilizes a memory vector store to manage and retrieve document embeddings, enhancing the project's ability to understand and summarize changes based on the context provided by relevant issues.

- **OpenAI API Integration:** The system now uses OpenAI's API to analyze code changes and commit messages. It generates suggestions for updating the README file based on the context of the changes made in the pull request.

- **Dynamic README Updates:** The README can now be automatically updated based on the changes made in the pull request, ensuring that documentation remains accurate and up-to-date.

## Environment Variables

Ensure the following environment variables are set up in your `.env` file:

- `OWNER`: The GitHub repository owner.
- `REPO`: The GitHub repository name.
- `PULL_REQUEST_NUMBER`: The number of the pull request to process.
- `MY_GITHUB_TOKEN`: GitHub token for access.
- `LINEAR_API_KEY`: API key for accessing Linear.

## Usage

To run the application, execute the following command:

```bash
node src/app.js
```

This command will process the specified pull request, analyze the changes, and create an updated pull request with the modified README file.

## Commit Messages

The following commit messages were captured during the project development:

- tech-writer-progress
- RAG
- create pull request with changes
- github action
- allow manual triggering of action
```

### Summary of Changes
- Changed the README title to reflect the course week and session.
- Added a section to describe the new features introduced by the code changes.
- Included instructions for setting up environment variables.
- Provided usage instructions for running the application.

This update maintains the existing style and clarity while accurately reflecting the new functionalities introduced in the project.