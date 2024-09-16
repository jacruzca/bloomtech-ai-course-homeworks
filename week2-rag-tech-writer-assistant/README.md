# Tech Writer Assistant

## Overview

The Tech Writer Assistant is a project designed to assist technical writers by providing tools and functionalities that streamline their workflow. This project integrates various components to enhance productivity and efficiency.

## Environment Variables

Before running the application, ensure that the following environment variables are set:

- **OWNER**: Your GitHub username or organization name.
- **REPO**: The name of your repository.
- **PULL_REQUEST_NUMBER**: The number of the pull request you want to work with. This should be set as an integer.

Make sure to configure these variables in your GitHub secrets for proper integration with CI/CD workflows.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tech-writer-assistant.git
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables as mentioned above.

## Usage

To run the application, use the following command:
```bash
npx tsx src/app.ts
```

## Documentation

Documentation has been updated across multiple folders to provide clearer guidance on usage and functionality. Please refer to the respective folders for detailed information.

## Contributing

Contributions are welcome! Please submit a pull request for any changes or improvements.

## License

This project is licensed under the MIT License.

---

This updated README reflects the recent changes to the documentation, ensuring that users have the correct information regarding environment variables and installation procedures. Additionally, the documentation now includes a more comprehensive overview of the project and its functionalities to better assist users.