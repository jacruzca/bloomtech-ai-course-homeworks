# Tech Writer Project

## Overview
The Tech Writer Project is designed to assist users in generating various types of outputs based on user inputs, utilizing advanced AI functionalities.

## Features
- **Fibonacci Sequence Generator**: This tool generates the Fibonacci sequence up to a specified number `n` using either iterative or recursive methods. Users can choose the method they prefer for generating the sequence.
  
- **Currency Converter**: This tool converts an amount from one currency to another using the Exchange Rates API. To use this functionality, users must provide:
  - The amount to convert
  - The currency to convert from
  - The currency to convert to

  The tool currently supports conversions between Colombian Pesos (COP) and United States Dollars (USD). The conversion is based on a placeholder rate as the API access is limited.

## Environment Variables
- **EXCHANGE_RATES_KEY**: Required for authenticating with the Exchange Rates API to enable currency conversion functionalities.

## Usage
To run the project, ensure that all necessary environment variables are set up. Use the command line to execute the main application.

## Example Inputs
- To generate the Fibonacci sequence: 
  - Input: `generate the Fibonacci sequence up to 15`
  
- To convert currency:
  - Input: `How much is 5000 COP to USD?`

## Installation
Make sure to install all dependencies listed in the `package.json` file before running the application.

## Contributing
Contributions are welcome! Please submit a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.

---

This README has been updated to reflect the addition of the Fibonacci Sequence Generator and Currency Converter tools, as well as the requirement for the `EXCHANGE_RATES_KEY` environment variable.