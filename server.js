// Simple Express server to proxy API requests
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.API_BASE_URL || 'https://api.rewiringamerica.org';

// Configure axios with defaults
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message || 'Unknown error occurred'
  });
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Calculator endpoint
app.get('/api/calculator', async (req, res) => {
  try {
    console.log('Calculator request params:', req.query);
    
    // Make sure all required parameters are present
    const params = {
      zip: req.query.zip,
      owner_status: req.query.owner_status || 'homeowner',
      household_income: req.query.household_income || 150000,
      household_size: req.query.household_size || 4,
      tax_filing: req.query.tax_filing || 'single'
    };
    
    if (!params.zip) {
      return res.status(400).json({ error: 'Missing required parameter: zip' });
    }
    
    console.log(`Making calculator request with params: ${JSON.stringify(params, null, 2)}`);
    
    const response = await axiosInstance.get('/api/v1/calculator', {
      params: {
        zip: params.zip,
        owner_status: params.owner_status,
        household_income: params.household_income,
        household_size: params.household_size,
        tax_filing: params.tax_filing
      }
    });
    
    console.log(`Calculator API success for zip: ${params.zip}`);
    console.log(`- Location: ${response.data.location?.city || 'Unknown'}, ${response.data.location?.state || 'Unknown'}`);
    
    res.json(response.data);
  } catch (error) {
    console.error('Calculator API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Server error', message: error.message });
    }
  }
});

// Utilities endpoint
app.get('/api/utilities', async (req, res) => {
  try {
    console.log('Utilities request params:', req.query);
    
    // Make sure all required parameters are present
    const params = {
      zip: req.query.zip
    };
    
    if (!params.zip) {
      return res.status(400).json({ error: 'Missing required parameter: zip' });
    }
    
    console.log(`Making utilities request with params: ${JSON.stringify(params, null, 2)}`);
    
    const response = await axiosInstance.get('/api/v1/utilities', {
      params: {
        zip: params.zip
      }
    });
    
    // Log the utilities information
    const electricUtilities = response.data.utilities || {};
    const gasUtilities = response.data.gas_utilities || {};
    
    const hasElectricUtilities = Object.keys(electricUtilities).length > 0;
    const hasGasUtilities = Object.keys(gasUtilities).length > 0;
    
    console.log(`Utilities API success for zip: ${params.zip}`);
    console.log(`- Location: ${response.data.location?.city || 'Unknown'}, ${response.data.location?.state || 'Unknown'}`);
    console.log(`- Electric utilities found: ${hasElectricUtilities ? Object.keys(electricUtilities).length : 'None'}`);
    console.log(`- Gas utilities found: ${hasGasUtilities ? Object.keys(gasUtilities).length : 'None'}`);
    
    if (hasElectricUtilities) {
      console.log('- Electric utility providers:', Object.keys(electricUtilities));
    }
    
    if (hasGasUtilities) {
      console.log('- Gas utility providers:', Object.keys(gasUtilities));
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Utilities API error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Server error', message: error.message });
    }
  }
});

// Incentives endpoint
app.get('/api/incentives', async (req, res) => {
    try {
        const { zip, owner_status, household_income, household_size, tax_filing } = req.query;
        console.log('Incentives request params:', req.query);

        // First get utilities for the zip code
        const utilitiesResponse = await axiosInstance.get('/api/v1/utilities', {
            params: { zip }
        });

        // Extract utilities from the response - get the first utility ID from each type
        const electric_utility = Object.keys(utilitiesResponse.data.utilities || {})[0];
        const gas_utility = Object.keys(utilitiesResponse.data.gas_utilities || {})[0];

        console.log('Utilities lookup results:');
        console.log(`- Electric utilities found: ${electric_utility || 'None'}`);
        console.log(`- Gas utilities found: ${gas_utility || 'None'}`);

        // Make calculator request with utilities
        const calculatorParams = {
            zip,
            owner_status,
            household_income,
            household_size,
            tax_filing,
            ...(electric_utility && { electric_utility }),
            ...(gas_utility && { gas_utility })
        };

        console.log('Making calculator request with params:', JSON.stringify(calculatorParams, null, 2));

        const calculatorResponse = await axiosInstance.get('/api/v1/calculator', {
            params: calculatorParams
        });

        console.log('Calculator response received');

        // Get incentives from calculator response
        const incentives = calculatorResponse.data.incentives || [];
        console.log(`Found ${incentives.length} incentives`);

        if (incentives.length > 0) {
            console.log('Sample incentive details:');
            console.log(`- Program: ${incentives[0].program}`);
            console.log(`- Authority: ${incentives[0].authority}`);
            console.log(`- Items: ${incentives[0].items.join(', ')}`);
        }

        // Return raw incentives data along with location and utilities
        res.json({
            location: calculatorResponse.data.location,
            eligibility: {
                is_under_80_ami: calculatorResponse.data.is_under_80_ami,
                is_under_150_ami: calculatorResponse.data.is_under_150_ami,
                is_over_150_ami: calculatorResponse.data.is_over_150_ami
            },
            incentives: incentives,
            utilities: {
                electric: utilitiesResponse.data.utilities?.[electric_utility]?.name || 'None found',
                gas: utilitiesResponse.data.gas_utilities?.[gas_utility]?.name || 'None found'
            }
        });
    } catch (error) {
        console.error('Error fetching incentives:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch incentives',
            message: error.message
        });
    }
});

// Events API endpoint
app.get('/api/events', async (req, res) => {
  try {
    const eventsPath = path.join(__dirname, 'public/data/events.json');
    const eventsData = await fs.readFile(eventsPath, 'utf8');
    const events = JSON.parse(eventsData);
    
    // Filter out past events
    const currentDate = new Date();
    const upcomingEvents = events.events.filter(event => new Date(event.date) >= currentDate);
    
    // Sort by date
    upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`Events API: Found ${upcomingEvents.length} upcoming events`);
    
    res.json({ events: upcomingEvents });
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Save events API endpoint
app.post('/api/events', express.json(), async (req, res) => {
  try {
    const events = req.body;
    
    // Validate request
    if (!events || !Array.isArray(events.events)) {
      return res.status(400).json({ error: 'Invalid events data format' });
    }
    
    const eventsPath = path.join(__dirname, 'public/data/events.json');
    
    // Format events data
    const formattedEvents = {
      events: events.events.map(event => ({
        id: event.id,
        date: event.date,
        displayDate: event.displayDate,
        title: event.title,
        description: event.description,
        location: event.location,
        link: event.link || '#'
      }))
    };
    
    // Save to file
    await fs.writeFile(eventsPath, JSON.stringify(formattedEvents, null, 2), 'utf8');
    
    console.log(`Events API: Saved ${formattedEvents.events.length} events`);
    
    res.json({ success: true, message: 'Events saved successfully' });
  } catch (error) {
    console.error('Error saving events:', error.message);
    res.status(500).json({ 
      error: 'Failed to save events',
      message: error.message
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API Base URL: ${BASE_URL}`);
}); 