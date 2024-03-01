# AI Codebase Copilot README

## Overview

AI Codebase Copilot is an innovative tool designed to revolutionize software development by integrating advanced AI capabilities directly into the codebase management process. Leveraging a custom GPT model, the Copilot acts as either the primary driver of development or as an assistant, capable of querying the codebase for contextual understanding and executing shell scripts to automate development tasks. This tool streamlines the development workflow, enhancing efficiency, accuracy, and ensuring comprehensive test coverage and functionality documentation.

## Core Functionality

AI Codebase Copilot interacts with your codebase through a series of specialized endpoints, executing scripts that make additions, revisions, or enhancements directly to the code. It's built to work with a development version of the repository, allowing changes to be tested and confirmed before being ported to the stable version. This approach ensures that the development process is both agile and reliable, minimizing disruptions to the main codebase while fostering innovation.

### Key Components

-   **`currentFunctionsList.json`**: Dynamically updated list of all named functions within the codebase, serving as a quick reference and facilitating the identification of changes over time.
-   **`functionalityTracker.json`**: A comprehensive record of functionalities, including their associated test files and documentation, crucial for maintaining high code quality and ensuring functionalities are correctly documented and tested.
-   **`functionsListHistory.json`**: Archives the history of changes to the named functions list, aiding in tracking the evolution of the codebase’s functionality.
-   **`generateAndTrackFunctionList.ts`**: Core script that automates the generation of the current functions list, updates the functions list history, and manages the functionality tracker, maintaining an accurate view of the codebase's functionalities.
-   **`runTestsAndUpdate.ts`**: Executes tests for the codebase and updates the functionality tracker with the latest test results, vital for maintaining high code quality.
-   **`server.ts`**: Backend server handling API requests for script execution, fetching file content, and managing the codebase structure and functionalities.
-   **`testHistory.json` & `testInitAndSetup.ts`**: Record test outcomes and initialize test configurations for functionalities, ensuring tests are correctly linked and documented.

## Workflow Integration

AI Codebase Copilot seamlessly integrates into existing development workflows, whether you're leading project development or assisting with code enhancements. Here’s how it fits into your workflow:

1.  **Setup**: Configure AI Codebase Copilot to access your project's repository, setting up the codebase paths for communication with your repo.
2.  **Define Tasks**: Specify development tasks for the AI, ranging from new feature development to code refactoring.
3.  **Collaboration**: Engage with the AI through its interface, providing feedback and additional information as needed.
4.  **Review and Testing**: After the AI completes tasks, review the changes, perform testing, and integrate the enhancements into your project.
5.  **Continuous Development**: Continuously interact with AI Codebase Copilot for ongoing project development and enhancements.

## Special Features

### Test Annotations and Functionality Tracking

-   **Test Annotations**: Use `@tests` annotations in code comments to link functions directly to their associated tests, aiding in test coverage verification.
-   **Functionality Tracking**: Leverage `@functionalityID` annotations to link code segments to documented features or requirements, enhancing project documentation and traceability.

## Getting Started

To get started with AI Codebase Copilot:

1.  **Endpoint Configuration**: Ensure your project exposes the necessary endpoints for the AI to query your codebase and execute scripts.
2.  **Initial Integration**: Integrate the AI Codebase Copilot into your project by adding the necessary file paths to point it to your repo, configuring it to access and interact with your repository.
3.  **Define Development Objectives**: Clearly outline your goals and tasks for the AI, enabling it to assist effectively. Especially useful is asking the GPT to query the current contents of any file, or multiple, and to provide specific entry points for new logic or needed revisions, asking to specify above or below or replacing an exact line in the file.

## Contributing

We welcome contributions to AI Codebase Copilot! Whether it's reporting bugs, requesting features, or contributing code, your input helps make AI Codebase Copilot better for everyone. Check our contributing guidelines for more information on how to get involved.

## Conclusion

AI Codebase Copilot offers a unique blend of AI-driven development capabilities, automating tasks, ensuring code quality, and streamlining the development process. By integrating AI Codebase Copilot into your projects, you embrace the future of software development, where AI and human creativity combine to push the boundaries of innovation.
