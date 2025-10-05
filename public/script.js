document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('energyForm');
  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.querySelector('.loading');
  const errorDiv = document.querySelector('.error');
  const calculatorResults = document.getElementById('calculatorResults').querySelector('.result-content');
  const utilitiesResults = document.getElementById('utilitiesResults').querySelector('.result-content');
  const incentivesResults = document.getElementById('incentivesResults').querySelector('.result-content');
  
  // Constants
  const PROXY_URL = '';
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    resultsDiv.style.display = 'block';
    
    try {
      const zipCode = document.getElementById('zipCode').value;
      const ownerStatus = document.getElementById('ownerStatus').value;
      const householdIncome = document.getElementById('householdIncome').value;
      const householdSize = document.getElementById('householdSize').value;
      const taxFiling = document.getElementById('taxFiling').value;

      // Make API calls
      const [calculatorResponse, utilitiesResponse, incentivesResponse] = await Promise.all([
        fetch(`${PROXY_URL}/api/calculator?zip=${zipCode}&owner_status=${ownerStatus}&household_income=${householdIncome}&household_size=${householdSize}&tax_filing=${taxFiling}`),
        fetch(`${PROXY_URL}/api/utilities?zip=${zipCode}`),
        fetch(`${PROXY_URL}/api/incentives?zip=${zipCode}&owner_status=${ownerStatus}&household_income=${householdIncome}&household_size=${householdSize}&tax_filing=${taxFiling}`)
      ]);

      // Check for errors
      if (!calculatorResponse.ok) {
        const errorText = await calculatorResponse.text();
        console.error(`Calculator API error: ${calculatorResponse.status}`, errorText);
        throw new Error(`Calculator API error: ${calculatorResponse.status}`);
      }

      if (!utilitiesResponse.ok) {
        const errorText = await utilitiesResponse.text();
        console.error(`Utilities API error: ${utilitiesResponse.status}`, errorText);
        throw new Error(`Utilities API error: ${utilitiesResponse.status}`);
      }

      if (!incentivesResponse.ok) {
        const errorText = await incentivesResponse.text();
        console.error(`Incentives API error: ${incentivesResponse.status}`, errorText);
        throw new Error(`Incentives API error: ${incentivesResponse.status}`);
      }

      // Parse responses
      const calculatorData = await calculatorResponse.json();
      const utilitiesData = await utilitiesResponse.json();
      const incentivesData = await incentivesResponse.json();

      // Display results
      displayResults(calculatorData, utilitiesData, incentivesData);
      
    } catch (error) {
      console.error('Error:', error);
      errorDiv.textContent = `An error occurred: ${error.message || 'Failed to fetch data from the server'}. Please try again or contact support if the problem persists.`;
      errorDiv.style.display = 'block';
    } finally {
      loadingDiv.style.display = 'none';
    }
  });
  
  // Display Results
  function displayResults(calculatorData, utilitiesData, incentivesData) {
    console.log('Displaying results:', { calculatorData, utilitiesData, incentivesData });
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // Add environmental quote
    const quoteDiv = document.createElement('div');
    quoteDiv.className = 'quote-box';
    quoteDiv.innerHTML = `
        <em>"We do not inherit the earth from our ancestors, we borrow it from our children."</em>
        <br>- Native American Proverb
    `;
    resultsDiv.appendChild(quoteDiv);

    // Fair Lawn Specific Header
    const fairLawnHeader = document.createElement('div');
    fairLawnHeader.className = 'fair-lawn-intro';
    fairLawnHeader.innerHTML = `
        <h2>Fair Lawn, NJ Energy Incentives</h2>
        <p>Based on your information, here are the energy incentives available to Fair Lawn residents. PSE&G is the main utility provider for Fair Lawn, offering additional programs to help you save on energy costs.</p>
    `;
    resultsDiv.appendChild(fairLawnHeader);

    // Eligibility Section
    const eligibilityDiv = document.createElement('div');
    eligibilityDiv.className = 'results-section';
    eligibilityDiv.innerHTML = `
        <h2>Eligibility Results</h2>
        <p><strong>Location:</strong> ${calculatorData.location.city}, ${calculatorData.location.state}</p>
        <p><strong>Income Eligibility:</strong></p>
        <ul>
            <li>Under 80% AMI: ${calculatorData.is_under_80_ami ? 'Yes' : 'No'}</li>
            <li>Under 150% AMI: ${calculatorData.is_under_150_ami ? 'Yes' : 'No'}</li>
            <li>Over 150% AMI: ${calculatorData.is_over_150_ami ? 'Yes' : 'No'}</li>
        </ul>
    `;
    resultsDiv.appendChild(eligibilityDiv);

    // Utilities Section
    const utilitiesDiv = document.createElement('div');
    utilitiesDiv.className = 'results-section';
    utilitiesDiv.innerHTML = `
        <h2>Fair Lawn Utilities</h2>
        <p><strong>Electric Utility:</strong> ${incentivesData.utilities.electric || 'PSE&G (Public Service Electric & Gas)'}</p>
        <p><strong>Gas Utility:</strong> ${incentivesData.utilities.gas || 'PSE&G (Public Service Electric & Gas)'}</p>
        <p><em>PSE&G serves most of Fair Lawn and offers additional energy efficiency programs for residents.</em></p>
    `;
    resultsDiv.appendChild(utilitiesDiv);

    // Incentives Section
    const incentivesDiv = document.createElement('div');
    incentivesDiv.className = 'results-section';
    incentivesDiv.innerHTML = '<h2>Available Incentives</h2>';

    if (incentivesData.incentives && incentivesData.incentives.length > 0) {
      console.log(`Found ${incentivesData.incentives.length} incentives to display`);
      
      // Calculate total potential savings and environmental impact
      let totalSavings = 0;
      let totalCarbonReduction = 0;
      let totalEnergySavings = 0;
      
      incentivesData.incentives.forEach(incentive => {
        console.log('Processing incentive:', incentive);
        if (incentive.amount && incentive.amount.representative) {
          totalSavings += incentive.amount.representative;
        }
        
        // Calculate environmental impact based on incentive type
        const environmentalImpact = calculateEnvironmentalImpact(incentive);
        totalCarbonReduction += environmentalImpact.co2Reduction;
        totalEnergySavings += environmentalImpact.energySavings;
      });

      // Display total savings and environmental impact
      if (totalSavings > 0) {
        const savingsDiv = document.createElement('div');
        savingsDiv.className = 'total-savings';
        savingsDiv.innerHTML = `
          <h3>Total Potential Savings: $${totalSavings.toLocaleString()}</h3>
        `;
        incentivesDiv.appendChild(savingsDiv);
      }

      // Display environmental impact section
      if (totalCarbonReduction > 0 || totalEnergySavings > 0) {
        const environmentalDiv = document.createElement('div');
        environmentalDiv.className = 'environmental-impact';
        environmentalDiv.innerHTML = `
          <h3>🌱 Environmental Impact</h3>
          <div class="impact-grid">
            <div class="impact-card co2-reduction">
              <div class="impact-icon">🌍</div>
              <div class="impact-value">${Math.round(totalCarbonReduction)}</div>
              <div class="impact-unit">lbs CO₂/year</div>
              <div class="impact-label">Carbon Reduction</div>
            </div>
            <div class="impact-card energy-savings">
              <div class="impact-icon">⚡</div>
              <div class="impact-value">${Math.round(totalEnergySavings)}</div>
              <div class="impact-unit">kWh/year</div>
              <div class="impact-label">Energy Savings</div>
            </div>
            <div class="impact-card trees-equivalent">
              <div class="impact-icon">🌳</div>
              <div class="impact-value">${Math.round(totalCarbonReduction / 48)}</div>
              <div class="impact-unit">trees</div>
              <div class="impact-label">Equivalent Trees Planted</div>
            </div>
            <div class="impact-card car-miles">
              <div class="impact-icon">🚗</div>
              <div class="impact-value">${Math.round(totalCarbonReduction / 0.411)}</div>
              <div class="impact-unit">miles</div>
              <div class="impact-label">Car Miles Offset</div>
            </div>
          </div>
        `;
        incentivesDiv.appendChild(environmentalDiv);
      }

      // Create incentives grid
      const gridDiv = document.createElement('div');
      gridDiv.className = 'incentives-grid';
      
      incentivesData.incentives.forEach((incentive, index) => {
        console.log(`Creating card for incentive ${index + 1}:`, incentive);
        const card = document.createElement('div');
        card.className = `incentive-card ${incentive.payment_type?.replace('_', '-') || 'other'}`;
        
        const amount = formatAmount(incentive.amount);
        console.log('Formatted amount:', amount);
        
        const environmentalImpact = calculateEnvironmentalImpact(incentive);
        
        card.innerHTML = `
          <div class="incentive-header">
            <h4>${incentive.program || 'Program Name Not Available'}</h4>
            <span class="incentive-type">${formatPaymentMethod(incentive.payment_type)}</span>
          </div>
          <p class="incentive-description">${incentive.description || incentive.short_description || 'No description available'}</p>
          <div class="incentive-details">
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Eligible Items:</strong> ${formatItems(incentive.items)}</p>
            ${incentive.start_date ? `<p><strong>Valid:</strong> ${incentive.start_date} - ${incentive.end_date || 'Ongoing'}</p>` : ''}
            ${incentive.authority ? `<p><strong>Authority:</strong> ${formatAuthority(incentive.authority)}</p>` : ''}
          </div>
          ${environmentalImpact.co2Reduction > 0 ? `
          <div class="incentive-environmental">
            <div class="env-impact-mini">
              <span class="env-icon">🌍</span>
              <span class="env-text">${Math.round(environmentalImpact.co2Reduction)} lbs CO₂/year</span>
            </div>
            <div class="env-impact-mini">
              <span class="env-icon">⚡</span>
              <span class="env-text">${Math.round(environmentalImpact.energySavings)} kWh/year</span>
            </div>
          </div>
          ` : ''}
          <div class="incentive-links">
            ${incentive.program_url ? `<a href="${incentive.program_url}" target="_blank" class="btn-primary">Program Details</a>` : ''}
            ${incentive.more_info_url ? `<a href="${incentive.more_info_url}" target="_blank" class="btn-secondary">Learn More</a>` : ''}
          </div>
        `;
        
        gridDiv.appendChild(card);
      });
      
      incentivesDiv.appendChild(gridDiv);
    } else {
      console.log('No incentives found in the data');
      incentivesDiv.innerHTML += '<p>No incentives available for your area and criteria.</p>';
    }
    
    resultsDiv.appendChild(incentivesDiv);

    // Next Steps Section
    const nextStepsDiv = document.createElement('div');
    nextStepsDiv.className = 'results-section next-steps';
    nextStepsDiv.innerHTML = `
        <h2>💡 Recommended Next Steps for Fair Lawn Residents</h2>
        <ol>
            <li>Schedule a professional home energy audit to identify the most impactful improvements for your Fair Lawn home</li>
            <li>Contact PSE&G at 1-800-436-7734 to learn about utility-specific rebate programs</li>
            <li>Consult with Fair Lawn's Building Department for any necessary permits at 201-794-5340</li>
            <li>Get quotes from certified contractors who have experience with Fair Lawn homes</li>
            <li>Review financing options and apply for available incentives</li>
            <li>Consider bundling multiple improvements to maximize your savings and benefits</li>
        </ol>
    `;
    resultsDiv.appendChild(nextStepsDiv);
  }
  
  // Helper Functions
  function formatAmount(amount) {
    if (!amount) return 'Amount not specified';
    
    // Handle percentage-based amounts
    if (amount.percentage) {
      if (amount.representative) {
        return `${amount.percentage}% (Est. $${amount.representative.toLocaleString()})`;
      }
      return `${amount.percentage}%`;
    }
    
    // Handle fixed amounts
    if (amount.value) {
      return `$${amount.value.toLocaleString()}`;
    }
    
    // Handle representative amounts
    if (amount.representative) {
      return `$${amount.representative.toLocaleString()}`;
    }
    
    // Handle range amounts
    if (amount.min && amount.max) {
      return `$${amount.min.toLocaleString()} - $${amount.max.toLocaleString()}`;
    }
    
    // Handle simple number amounts
    if (typeof amount === 'number') {
      return `$${amount.toLocaleString()}`;
    }
    
    return 'Amount varies';
  }

  function formatPaymentMethod(method) {
    if (!method) return 'Not specified';
    const formats = {
      'tax_credit': 'Tax Credit',
      'rebate': 'Rebate',
      'pos_rebate': 'Point of Sale Rebate',
      'performance_rebate': 'Performance Rebate',
      'assistance_program': 'Assistance Program'
    };
    return formats[method] || method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  function formatItems(items) {
    if (!items || !Array.isArray(items) || items.length === 0) return 'Not specified';
    return items.map(item => 
      item.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    ).join(', ');
  }

  function formatAuthority(authority) {
    if (!authority) return 'Not specified';
    return authority.split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Calculate environmental impact based on incentive type and items
  function calculateEnvironmentalImpact(incentive) {
    let co2Reduction = 0;
    let energySavings = 0;
    
    if (!incentive.items || !Array.isArray(incentive.items)) {
      return { co2Reduction: 0, energySavings: 0 };
    }
    
    // Environmental impact multipliers based on common energy efficiency measures
    const impactMultipliers = {
      // HVAC and Heat Pumps
      'heat_pump': { co2: 1200, energy: 2000 },
      'air_source_heat_pump': { co2: 1200, energy: 2000 },
      'ground_source_heat_pump': { co2: 1500, energy: 2500 },
      'central_air_conditioning': { co2: 800, energy: 1500 },
      'furnace': { co2: 1000, energy: 1800 },
      'boiler': { co2: 900, energy: 1600 },
      
      // Solar and Storage
      'solar_pv': { co2: 2000, energy: 3000 },
      'battery_storage': { co2: 300, energy: 500 },
      'solar_water_heater': { co2: 600, energy: 1000 },
      
      // Insulation and Weatherization
      'insulation': { co2: 400, energy: 800 },
      'air_sealing': { co2: 300, energy: 600 },
      'windows': { co2: 200, energy: 400 },
      'doors': { co2: 100, energy: 200 },
      'roof': { co2: 500, energy: 1000 },
      
      // Water Heating
      'water_heater': { co2: 400, energy: 800 },
      'tankless_water_heater': { co2: 300, energy: 600 },
      
      // Lighting and Appliances
      'led_lighting': { co2: 50, energy: 100 },
      'appliances': { co2: 200, energy: 400 },
      'refrigerator': { co2: 150, energy: 300 },
      'washer_dryer': { co2: 100, energy: 200 },
      
      // Electric Vehicles
      'electric_vehicle': { co2: 3000, energy: 5000 },
      'ev_charger': { co2: 200, energy: 300 },
      
      // Electrical
      'electrical_panel': { co2: 100, energy: 200 },
      'smart_thermostat': { co2: 200, energy: 400 },
      
      // Default for unknown items
      'default': { co2: 100, energy: 200 }
    };
    
    // Calculate impact for each item
    incentive.items.forEach(item => {
      const itemKey = item.toLowerCase().replace(/[^a-z_]/g, '_');
      const multiplier = impactMultipliers[itemKey] || impactMultipliers.default;
      
      // Scale based on incentive amount (if available)
      let scaleFactor = 1;
      if (incentive.amount && incentive.amount.representative) {
        // Scale factor based on incentive value (higher value = more significant impact)
        scaleFactor = Math.min(incentive.amount.representative / 1000, 3); // Cap at 3x
      }
      
      co2Reduction += multiplier.co2 * scaleFactor;
      energySavings += multiplier.energy * scaleFactor;
    });
    
    return {
      co2Reduction: Math.round(co2Reduction),
      energySavings: Math.round(energySavings)
    };
  }
}); 
