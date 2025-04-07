document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('energyForm');
  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.querySelector('.loading');
  const errorDiv = document.querySelector('.error');
  const calculatorResults = document.getElementById('calculatorResults').querySelector('.result-content');
  const utilitiesResults = document.getElementById('utilitiesResults').querySelector('.result-content');
  const incentivesResults = document.getElementById('incentivesResults').querySelector('.result-content');
  
  // Constants
  const PROXY_URL = 'http://localhost:3000';
  
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
      if (!calculatorResponse.ok || !utilitiesResponse.ok || !incentivesResponse.ok) {
        throw new Error('Failed to fetch data from the server');
      }

      // Parse responses
      const calculatorData = await calculatorResponse.json();
      const utilitiesData = await utilitiesResponse.json();
      const incentivesData = await incentivesResponse.json();

      // Display results
      displayResults(calculatorData, utilitiesData, incentivesData);
      
    } catch (error) {
      console.error('Error:', error);
      errorDiv.textContent = 'An error occurred while fetching the data. Please try again.';
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
        <h2>Available Utilities</h2>
        <p><strong>Electric Utility:</strong> ${incentivesData.utilities.electric || 'None found'}</p>
        <p><strong>Gas Utility:</strong> ${incentivesData.utilities.gas || 'None found'}</p>
    `;
    resultsDiv.appendChild(utilitiesDiv);

    // Incentives Section
    const incentivesDiv = document.createElement('div');
    incentivesDiv.className = 'results-section';
    incentivesDiv.innerHTML = '<h2>Available Incentives</h2>';

    if (incentivesData.incentives && incentivesData.incentives.length > 0) {
      console.log(`Found ${incentivesData.incentives.length} incentives to display`);
      
      // Calculate total potential savings
      let totalSavings = 0;
      incentivesData.incentives.forEach(incentive => {
        console.log('Processing incentive:', incentive);
        if (incentive.amount && incentive.amount.representative) {
          totalSavings += incentive.amount.representative;
        }
      });

      // Display total savings if available
      if (totalSavings > 0) {
        const savingsDiv = document.createElement('div');
        savingsDiv.className = 'total-savings';
        savingsDiv.innerHTML = `
          <h3>Total Potential Savings: $${totalSavings.toLocaleString()}</h3>
        `;
        incentivesDiv.appendChild(savingsDiv);
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
        <h2>💡 Recommended Next Steps</h2>
        <ol>
            <li>Schedule a professional home energy audit to identify the most impactful improvements for your home</li>
            <li>Contact your utility providers (${incentivesData.utilities?.electric || 'Electric'} and ${incentivesData.utilities?.gas || 'Gas'}) about additional rebate programs</li>
            <li>Get quotes from certified contractors for your chosen projects</li>
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
}); 