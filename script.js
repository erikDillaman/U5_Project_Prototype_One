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

// API Functions
async function loadRandomArtworks() {
    try {
        console.log('Loading random artworks from Met API...');
        showLoadingSkeletons();
        
        // Get random objects from Met API
        const response = await fetch(`${MET_API_BASE}/objects`);
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
        // Fall back to curated list if API fails
        loadCuratedArtworks();
    }
}

async function searchArtworks(query) {
    try {
        console.log('Searching for:', query);
        showLoadingSkeletons();
        
        // Search using Met API
        const searchUrl = `${MET_API_BASE}/search?hasImages=true&q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl);
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
        showErrorMessage('Search failed. Please try again.');
    }
}

async function loadArtworkDetails(objectIds) {
    const artworks = [];
    
    // Load details for each artwork (limit concurrent requests)
    const batchSize = 4;
    for (let i = 0; i < objectIds.length; i += batchSize) {
        const batch = objectIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (id) => {
            try {
                const response = await fetch(`${MET_API_BASE}/objects/${id}`);
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
        
        // Add small delay between batches to be respectful to the API
        if (i + batchSize < objectIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
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
        showErrorMessage('Failed to load artworks. Please try again.');
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
        </div>
    `;
    
    cardsGrid.appendChild(errorDiv);
}

// Export functions for potential module use
window.MuseumApp = {
    loadRandomArtworks,
    searchArtworks,
    displayArtworks,
    clearSearch
};
