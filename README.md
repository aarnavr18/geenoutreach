# Energy Savings Calculator

A web application that helps users find energy-related incentives and savings opportunities based on their location and household information.

## Features

- Calculate available energy incentives based on location and household details
- Display federal and state incentives
- Show utility provider information
- Estimate potential savings

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

The application uses the following environment variables:
- `PORT` (optional): Port number for the server (defaults to 3000)
- `API_BASE_URL`: Base URL for the Rewiring America API

## Deployment

This application can be deployed on Render.com:
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add your environment variables in the Render dashboard

## API Endpoints

The application provides three main API endpoints:

- `/api/calculator` - Get information about available incentives and savings
- `/api/utilities` - Get information about utilities in a given area
- `/api/incentives` - Get information about available incentive programs

All endpoints require at least a `zip` parameter.

## Usage

1. Enter your zip code and household information
2. Click "Get Results" to see your personalized energy incentives
3. View the results organized by category

## Built With

- [Express](https://expressjs.com/) - Backend framework
- [Rewiring America API](https://rewiringamerica.org/) - Energy incentives data
- Vanilla JavaScript, HTML, and CSS for the frontend

## License

This project is available for private use.

## Acknowledgments

- Rewiring America for providing the API and data 