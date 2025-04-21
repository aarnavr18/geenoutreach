document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
});

async function loadEvents() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) {
      throw new Error('Failed to load events data');
    }
    
    const data = await response.json();
    displayEvents(data.events);
  } catch (error) {
    console.error('Error loading events:', error);
    document.querySelector('.events-list').innerHTML = `
      <div class="error-message">
        <p>Unable to load upcoming events. Please check back later.</p>
      </div>
    `;
  }
}

function displayEvents(events) {
  const eventsContainer = document.querySelector('.events-list');
  
  // Clear any existing content
  eventsContainer.innerHTML = '';
  
  // Sort events by date
  const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Filter out past events
  const currentDate = new Date();
  const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= currentDate);
  
  if (upcomingEvents.length === 0) {
    eventsContainer.innerHTML = `
      <div class="no-events-message">
        <p>No upcoming events scheduled at this time. Please check back later.</p>
      </div>
    `;
    return;
  }
  
  // Display maximum 3 upcoming events
  const eventsToShow = upcomingEvents.slice(0, 3);
  
  eventsToShow.forEach(event => {
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    eventCard.innerHTML = `
      <div class="event-date">${event.displayDate}</div>
      <h3>${event.title}</h3>
      <p>${event.description}</p>
      <p><strong>Location:</strong> ${event.location}</p>
      <a href="${event.link}" class="btn-secondary">Event Details</a>
    `;
    eventsContainer.appendChild(eventCard);
  });
  
  // If there are more events than we're showing
  if (upcomingEvents.length > 3) {
    const viewMoreBtn = document.createElement('div');
    viewMoreBtn.className = 'view-more-events';
    viewMoreBtn.innerHTML = `
      <a href="#" class="btn-primary">View All ${upcomingEvents.length} Events</a>
    `;
    eventsContainer.parentNode.appendChild(viewMoreBtn);
  }
} 