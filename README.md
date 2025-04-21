# Fair Lawn Energy Savings Calculator

A web application that helps Fair Lawn residents find energy-related incentives and savings opportunities based on their household information.

## Features

- Calculate available energy incentives based on location and household details
- Display federal, state, and local incentives for Fair Lawn residents
- Show utility provider information
- Estimate potential savings
- Sustainability information page
- Contact information for Green Team members
- Dynamic event management for sustainability events
- Interactive contact form

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Rewiring America API key:
   ```
   API_KEY=your_api_key_here
   API_BASE_URL=https://api.rewiringamerica.org
   PORT=3000
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

The application uses the following environment variables:
- `API_KEY`: Your Rewiring America API key
- `API_BASE_URL`: Base URL for the Rewiring America API
- `PORT` (optional): Port number for the server (defaults to 3000)

## Deployment on Render

This application is ready for deployment on Render.com:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the deployment with these settings:
   - **Name**: fair-lawn-energy-calculator
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add the environment variables in the Render dashboard:
   - `API_KEY`: Your Rewiring America API key
   - `API_BASE_URL`: https://api.rewiringamerica.org
   - `PORT`: 10000 (Render assigns a port via the PORT environment variable)
5. Deploy the service

You can also use the included `render.yaml` file for Blueprint deployment.

## API Endpoints

The application provides several API endpoints:

- `/api/calculator` - Get information about available incentives and savings
- `/api/utilities` - Get information about utilities in a given area
- `/api/incentives` - Get information about available incentive programs
- `/api/events` - Get and manage sustainability events

Most endpoints require at least a `zip` parameter.

## Pages

- **Energy Calculator**: The main calculator for finding available incentives
- **Sustainability**: Information about Fair Lawn's sustainability initiatives and goals
- **Contacts**: Contact information for Fair Lawn Green Team members
- **Events Admin**: Admin page for managing sustainability events

## Built With

- [Express](https://expressjs.com/) - Backend framework
- [Rewiring America API](https://rewiringamerica.org/) - Energy incentives data
- Vanilla JavaScript, HTML, and CSS for the frontend

## License

This project is available for private use.

## Acknowledgments

- Rewiring America for providing the API and data
- Fair Lawn Green Team for their sustainability initiatives 