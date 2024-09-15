# Tech Writer Assistant

## Overview

The Tech Writer Assistant is an AI-driven tool designed to help generate and update documentation based on code changes. It analyzes pull requests and associated commit messages, extracts relevant information, and generates suggestions for README updates.

## Features

- **Contextual Analysis**: Utilizes OpenAI models to analyze the context of pull requests and suggest updates for README files.
- **Integration with Repository**: Fetches pull request data, including modified files and commit messages, to understand the changes made.
- **Dynamic Documentation**: Automatically generates documentation content based on the code changes and relevant information.

## Usage

### Environment Variables

Before running the application, ensure the following environment variables are set:

- `OWNER`: The owner of the GitHub repository.
- `REPO`: The name of the GitHub repository.
- `PULL_REQUEST_NUMBER`: The number of the pull request to be analyzed.

### Running the Application

The main function `run` processes the pull request, builds vector store embeddings, and interacts with OpenAI to analyze related issues. To execute the application, use the following command:

```bash
npm run lesson3
```

### Functionality

1. **Get Modified Files**: The application fetches a list of files that have been modified in the pull request.
2. **Get Commit Messages**: It retrieves the commit messages associated with the pull request.
3. **Find Adjacent README Files**: The tool identifies README files adjacent to the modified files to provide better context for documentation updates.
4. **Fetch Pull Request Details**: Detailed information about the pull request is gathered for comprehensive analysis.
5. **OpenAI Interaction**: The application calls the OpenAI model to analyze the context and generate responses based on the input parameters.
6. **Create Pull Request for Results**: After generating results, the application creates a new pull request containing the suggestions for README updates.

## Code Structure

- **src/app.ts**: Main application logic and execution flow.
- **src/ai-util.ts**: Utilities for interacting with OpenAI models, including the analysis of pull request context.
- **src/github-util.ts**: Utilities for interacting with GitHub APIs, fetching pull request data, and retrieving modified files.

## Commit History

- **chore**: Update documentation for tech writer assistant - Improved documentation to better explain the purpose and functionality of the `callOpenAI` function and the overall application workflow.

## Conclusion

The Tech Writer Assistant is an evolving tool that enhances the documentation process by leveraging AI to analyze code changes effectively. By automating the documentation generation process, it aids developers and technical writers in maintaining accurate and up-to-date documentation with minimal effort.