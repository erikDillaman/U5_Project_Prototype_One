// Museum Explorer App - Main JavaScript File

// DOM Elements
const cardView = document.getElementById('card-view');
const cardsGrid = document.getElementById('cards-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// App State
let currentArtworks = [];

// Metropolitan Museum API Configuration
const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

// Rate limiting and API monitoring
let apiCallCount = 0;
let rateLimitResetTime = null;
let isRateLimited = false;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    
    // Check for search parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
        searchArtworks(searchQuery);
    }
});

// App Initialization
function initializeApp() {
    console.log('Museum Explorer App initialized');
    
    // Only load random artworks if no search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('search')) {
        loadRandomArtworks();
    }
}

// Event Listeners
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Enhanced API call function with rate limiting detection
async function makeApiCall(url, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    try {
        // Check if we're currently rate limited
        if (isRateLimited && rateLimitResetTime && Date.now() < rateLimitResetTime) {
            const waitTime = rateLimitResetTime - Date.now();
            console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            isRateLimited = false;
        }
        
        apiCallCount++;
        console.log(`API Call #${apiCallCount}: ${url}`);
        
        const response = await fetch(url);
        
        // Check for rate limiting
        if (response.status === 429) {
            console.warn('Rate limited by Met API (429)');
            isRateLimited = true;
            
            // Check for Retry-After header
            const retryAfter = response.headers.get('Retry-After');
            if (retryAfter) {
                const waitTime = parseInt(retryAfter) * 1000; // Convert to milliseconds
                rateLimitResetTime = Date.now() + waitTime;
                console.log(`Retry-After header: ${retryAfter}s`);
            } else {
                // Default exponential backoff
                const waitTime = baseDelay * Math.pow(2, retryCount);
                rateLimitResetTime = Date.now() + waitTime;
                console.log(`Using exponential backoff: ${waitTime}ms`);
            }
            
            if (retryCount < maxRetries) {
                console.log(`Retrying in ${rateLimitResetTime - Date.now()}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, rateLimitResetTime - Date.now()));
                return makeApiCall(url, retryCount + 1);
            } else {
                throw new Error('Rate limited: Maximum retries exceeded');
            }
        }
        
        // Check for other HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Log successful response
        console.log(`API Call successful: ${response.status}`);
        
        // Check response headers for rate limit info
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const limit = response.headers.get('X-RateLimit-Limit');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining !== null) {
            console.log(`Rate limit info - Remaining: ${remaining}, Limit: ${limit}, Reset: ${reset}`);
            
            // Warn if approaching rate limit
            if (parseInt(remaining) < 10) {
                console.warn(`Approaching rate limit: ${remaining} requests remaining`);
                showApiWarning(`API rate limit warning: ${remaining} requests remaining`);
            }
        }
        
        return response;
        
    } catch (error) {
        if (retryCount < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
            // Network error - retry with exponential backoff
            const waitTime = baseDelay * Math.pow(2, retryCount);
            console.log(`Network error, retrying in ${waitTime}ms... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return makeApiCall(url, retryCount + 1);
        }
        throw error;
    }
}

// API Functions
async function loadRandomArtworks() {
    try {
        console.log('Loading random artworks from Met API...');
        showLoadingSkeletons();
        
        // Get random objects from Met API
        const response = await makeApiCall(`${MET_API_BASE}/objects`);
        const data = await response.json();
        
        if (data.objectIDs && data.objectIDs.length > 0) {
            // Get a random sample of object IDs
            const randomIds = getRandomSample(data.objectIDs, 12);
            const artworks = await loadArtworkDetails(randomIds);
            displayArtworks(artworks);
        } else {
            throw new Error('No artworks found');
        }
        
    } catch (error) {
        console.error('Error loading artworks:', error);
        
        if (error.message.includes('Rate limited')) {
            showErrorMessage('API rate limit exceeded. Please wait a moment and try again.');
        } else {
            // Fall back to curated list if API fails
            loadCuratedArtworks();
        }
    }
}

async function searchArtworks(query) {
    try {
        console.log('Searching for:', query);
        showLoadingSkeletons();
        
        // Search using Met API
        const searchUrl = `${MET_API_BASE}/search?hasImages=true&q=${encodeURIComponent(query)}`;
        const response = await makeApiCall(searchUrl);
        const data = await response.json();
        
        if (data.objectIDs && data.objectIDs.length > 0) {
            // Get first 12 results
            const searchIds = data.objectIDs.slice(0, 12);
            const artworks = await loadArtworkDetails(searchIds);
            displayArtworks(artworks);
        } else {
            // No results found
            hideLoadingSkeletons();
            showNoResults(query);
        }
        
    } catch (error) {
        console.error('Error searching artworks:', error);
        
        if (error.message.includes('Rate limited')) {
            showErrorMessage('Search rate limit exceeded. Please wait a moment and try again.');
        } else {
            showErrorMessage('Search failed. Please try again.');
        }
    }
}

async function loadArtworkDetails(objectIds) {
    const artworks = [];
    
    // Load details for each artwork (limit concurrent requests to respect rate limits)
    const batchSize = 3; // Reduced from 4 to be more conservative
    for (let i = 0; i < objectIds.length; i += batchSize) {
        const batch = objectIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (id) => {
            try {
                const response = await makeApiCall(`${MET_API_BASE}/objects/${id}`);
                const artwork = await response.json();
                
                // Only include artworks with images
                if (artwork.primaryImage && artwork.title) {
                    return {
                        id: artwork.objectID,
                        title: artwork.title,
                        artist: artwork.artistDisplayName || 'Unknown Artist',
                        location: artwork.department || 'Metropolitan Museum',
                        image: artwork.primaryImageSmall || artwork.primaryImage,
                        culture: artwork.culture,
                        date: artwork.objectDate,
                        medium: artwork.medium
                    };
                }
                return null;
            } catch (error) {
                console.error(`Error loading artwork ${id}:`, error);
                return null;
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        artworks.push(...batchResults.filter(artwork => artwork !== null));
        
        // Add delay between batches to be respectful to the API
        if (i + batchSize < objectIds.length) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
        }
    }
    
    return artworks;
}

// Fallback function for curated artworks when API is unavailable
async function loadCuratedArtworks() {
    try {
        console.log('Loading curated artworks...');
        
        // Curated list of known Met artwork IDs with images
        const curatedIds = [
            436532, // Van Gogh - Wheat Field with Cypresses
            459123, // Monet - Water Lilies
            437853, // Picasso - Portrait of Gertrude Stein
            438817, // Degas - The Dance Class
            436105, // Cézanne - Mont Sainte-Victoire
            437984, // Renoir - Madame Charpentier and Her Children
            438821, // Manet - Boating
            436947, // Van Gogh - Self-Portrait with a Straw Hat
            459080, // Monet - The Houses of Parliament
            437329, // Sargent - Madame X
            438013, // Cassatt - The Child's Bath
            436535  // Van Gogh - Irises
        ];
        
        const artworks = await loadArtworkDetails(curatedIds);
        displayArtworks(artworks);
        
    } catch (error) {
        console.error('Error loading curated artworks:', error);
        showErrorMessage('Failed to load artworks. The API may be temporarily unavailable.');
    }
}

// Utility function to get random sample from array
function getRandomSample(array, size) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
}

// UI Functions
function showLoadingSkeletons() {
    const skeletonCards = document.querySelectorAll('.skeleton-card');
    skeletonCards.forEach(card => {
        card.style.display = 'block';
    });
}

function hideLoadingSkeletons() {
    const skeletonCards = document.querySelectorAll('.skeleton-card');
    skeletonCards.forEach(card => {
        card.style.display = 'none';
    });
}

function displayArtworks(artworks) {
    hideLoadingSkeletons();
    currentArtworks = artworks;
    
    // Clear existing non-skeleton cards
    const existingCards = cardsGrid.querySelectorAll('.card:not(.skeleton-card)');
    existingCards.forEach(card => card.remove());
    
    // Create new cards
    artworks.forEach(artwork => {
        const cardElement = createArtworkCard(artwork);
        cardsGrid.appendChild(cardElement);
    });
    
    // Hide "no results" message if it exists
    const noResultsMsg = document.querySelector('.no-results');
    if (noResultsMsg) {
        noResultsMsg.remove();
    }
    
    // Hide any API warnings
    hideApiWarning();
}

function createArtworkCard(artwork) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Truncate long titles for better display
    const displayTitle = artwork.title.length > 50 ? 
        artwork.title.substring(0, 47) + '...' : artwork.title;
    
    card.innerHTML = `
        <div class="card-image" style="background-image: url('${artwork.image}')"></div>
        <div class="card-content">
            <div class="card-title">${displayTitle}</div>
            <div class="card-location">
                <span class="location-icon">🎨</span>
                ${artwork.artist}
            </div>
            ${artwork.date ? `<div class="card-date">${artwork.date}</div>` : ''}
        </div>
    `;
    
    // Add click handler to navigate to detailed page
    card.addEventListener('click', () => {
        window.location.href = `artwork-detail.html?id=${artwork.id}`;
    });
    
    return card;
}

function showNoResults(query) {
    // Clear existing non-skeleton cards
    const existingCards = cardsGrid.querySelectorAll('.card:not(.skeleton-card)');
    existingCards.forEach(card => card.remove());
    
    // Create no results message
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results';
    noResultsDiv.innerHTML = `
        <div class="no-results-content">
            <h3>No artworks found</h3>
            <p>No artworks were found for "${query}". Try a different search term.</p>
            <button onclick="clearSearch()" class="clear-search-btn">Clear Search</button>
        </div>
    `;
    
    cardsGrid.appendChild(noResultsDiv);
}

function showApiWarning(message) {
    // Remove existing warning
    hideApiWarning();
    
    // Create warning banner
    const warningDiv = document.createElement('div');
    warningDiv.id = 'api-warning';
    warningDiv.className = 'api-warning';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">${message}</span>
            <button onclick="hideApiWarning()" class="warning-close">×</button>
        </div>
    `;
    
    // Insert at top of main container
    const mainContainer = document.querySelector('.main-container');
    mainContainer.insertBefore(warningDiv, mainContainer.firstChild);
}

function hideApiWarning() {
    const warning = document.getElementById('api-warning');
    if (warning) {
        warning.remove();
    }
}

// Make hideApiWarning available globally
window.hideApiWarning = hideApiWarning;

// Search Handler
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        // Update URL with search parameter
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('search', query);
        window.history.pushState({}, '', newUrl);
        
        searchArtworks(query);
    } else {
        clearSearch();
    }
}

// Clear search function
function clearSearch() {
    searchInput.value = '';
    
    // Clear search parameter and load random artworks
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('search');
    window.history.pushState({}, '', newUrl);
    
    loadRandomArtworks();
}

// Make clearSearch available globally
window.clearSearch = clearSearch;

// Utility Functions
function showErrorMessage(message) {
    hideLoadingSkeletons();
    
    // Clear existing cards
    const existingCards = cardsGrid.querySelectorAll('.card:not(.skeleton-card)');
    existingCards.forEach(card => card.remove());
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="loadRandomArtworks()" class="retry-btn">Try Again</button>
            <div class="api-status">
                <small>API Calls Made: ${apiCallCount} | Rate Limited: ${isRateLimited ? 'Yes' : 'No'}</small>
            </div>
        </div>
    `;
    
    cardsGrid.appendChild(errorDiv);
}

// Debug function to check API status
function getApiStatus() {
    return {
        apiCallCount,
        isRateLimited,
        rateLimitResetTime,
        timeUntilReset: rateLimitResetTime ? Math.max(0, rateLimitResetTime - Date.now()) : 0
    };
}

// Make debug function available globally
window.getApiStatus = getApiStatus;

// Export functions for potential module use
window.MuseumApp = {
    loadRandomArtworks,
    searchArtworks,
    displayArtworks,
    clearSearch,
    getApiStatus
};
