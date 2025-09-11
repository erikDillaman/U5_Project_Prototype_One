// Artwork Detail Page - JavaScript

// DOM Elements
const backBtn = document.getElementById('back-to-gallery');
const artworkMainImage = document.getElementById('artwork-main-image');
const additionalImagesContainer = document.getElementById('additional-images');
const artworkTitle = document.getElementById('artwork-title');
const artistName = document.getElementById('artist-name');
const artistBio = document.getElementById('artist-bio');
const artistNationality = document.getElementById('artist-nationality');
const artistDates = document.getElementById('artist-dates');

// Metadata elements
const objectName = document.getElementById('object-name');
const objectDate = document.getElementById('object-date');
const medium = document.getElementById('medium');
const dimensions = document.getElementById('dimensions');
const classification = document.getElementById('classification');
const culture = document.getElementById('culture');
const period = document.getElementById('period');
const dynasty = document.getElementById('dynasty');
const geography = document.getElementById('geography');
const department = document.getElementById('department');
const accessionNumber = document.getElementById('accession-number');
const creditLine = document.getElementById('credit-line');
const galleryNumber = document.getElementById('gallery-number');
const publicDomain = document.getElementById('public-domain');
const rightsReproduction = document.getElementById('rights-reproduction');
const metWebsiteLink = document.getElementById('met-website-link');
const wikidataLink = document.getElementById('wikidata-link');
const artworkTags = document.getElementById('artwork-tags');
const relatedArtworks = document.getElementById('related-artworks');

// Loading and error states
const detailLoading = document.getElementById('detail-loading');
const detailError = document.getElementById('detail-error');
const artworkDetail = document.querySelector('.artwork-detail');

// Metropolitan Museum API Configuration
const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

// Rate limiting and API monitoring
let apiCallCount = 0;
let rateLimitResetTime = null;
let isRateLimited = false;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeDetailPage();
    setupEventListeners();
});

// Page Initialization
function initializeDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const objectId = urlParams.get('id');
    
    if (objectId) {
        loadArtworkDetails(objectId);
    } else {
        showError('No artwork ID provided');
    }
}

// Event Listeners
function setupEventListeners() {
    // Back button
    backBtn.addEventListener('click', function() {
        window.history.back();
    });

    // Image controls
    const zoomBtn = document.querySelector('.zoom-btn');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    
    if (zoomBtn) {
        zoomBtn.addEventListener('click', handleImageZoom);
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', handleImageFullscreen);
    }
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
        console.log(`Detail Page API Call #${apiCallCount}: ${url}`);
        
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
        console.log(`Detail Page API Call successful: ${response.status}`);
        
        // Check response headers for rate limit info
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const limit = response.headers.get('X-RateLimit-Limit');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining !== null) {
            console.log(`Rate limit info - Remaining: ${remaining}, Limit: ${limit}, Reset: ${reset}`);
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
async function loadArtworkDetails(objectId) {
    try {
        showLoading();
        
        // Fetch artwork details from Met API
        const response = await makeApiCall(`${MET_API_BASE}/objects/${objectId}`);
        
        const artworkData = await response.json();
        
        if (artworkData && artworkData.objectID) {
            populateArtworkDetails(artworkData);
            hideLoading();
        } else {
            throw new Error('Artwork not found');
        }
        
    } catch (error) {
        console.error('Error loading artwork details:', error);
        
        let errorMessage = 'Failed to load artwork details.';
        if (error.message.includes('Rate limited')) {
            errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('HTTP 404')) {
            errorMessage = 'This artwork was not found in the museum\'s collection.';
        } else if (error.message.includes('HTTP')) {
            errorMessage = 'The museum\'s API is temporarily unavailable. Please try again later.';
        }
        
        showError(errorMessage);
    }
}

// UI Population Functions
function populateArtworkDetails(artwork) {
    // Primary information
    artworkTitle.textContent = artwork.title || 'Untitled';
    
    // Artist information
    if (artwork.artistDisplayName) {
        artistName.textContent = artwork.artistDisplayName;
        artistBio.textContent = artwork.artistDisplayBio || '';
        
        if (artwork.artistNationality) {
            artistNationality.textContent = artwork.artistNationality;
        }
        
        if (artwork.artistBeginDate || artwork.artistEndDate) {
            const beginDate = artwork.artistBeginDate || '?';
            const endDate = artwork.artistEndDate || '?';
            artistDates.textContent = `${beginDate} - ${endDate}`;
        }
    } else {
        artistName.textContent = 'Unknown Artist';
        artistBio.textContent = '';
        artistNationality.textContent = '';
        artistDates.textContent = '';
    }
    
    // Main image
    if (artwork.primaryImage) {
        artworkMainImage.src = artwork.primaryImage;
        artworkMainImage.alt = artwork.title;
    } else {
        artworkMainImage.src = 'https://via.placeholder.com/600x400?text=No+Image+Available';
        artworkMainImage.alt = 'No image available';
    }
    
    // Additional images
    if (artwork.additionalImages && artwork.additionalImages.length > 0) {
        populateAdditionalImages(artwork.additionalImages);
    } else {
        additionalImagesContainer.style.display = 'none';
    }
    
    // Object details
    objectName.textContent = artwork.objectName || '';
    objectDate.textContent = artwork.objectDate || '';
    medium.textContent = artwork.medium || '';
    dimensions.textContent = artwork.dimensions || '';
    classification.textContent = artwork.classification || '';
    
    // Cultural information
    culture.textContent = artwork.culture || '';
    period.textContent = artwork.period || '';
    dynasty.textContent = artwork.dynasty || '';
    
    // Geography
    const geoInfo = buildGeographyString(artwork);
    geography.textContent = geoInfo;
    
    // Museum information
    department.textContent = artwork.department || '';
    accessionNumber.textContent = artwork.accessionNumber || '';
    creditLine.textContent = artwork.creditLine || '';
    galleryNumber.textContent = artwork.GalleryNumber || '';
    
    // Rights information
    publicDomain.textContent = artwork.isPublicDomain ? 'Yes' : 'No';
    rightsReproduction.textContent = artwork.rightsAndReproduction || '';
    
    // External links
    if (artwork.objectURL) {
        metWebsiteLink.href = artwork.objectURL;
        metWebsiteLink.style.display = 'inline-block';
    } else {
        metWebsiteLink.style.display = 'none';
    }
    
    if (artwork.objectWikidata_URL) {
        wikidataLink.href = artwork.objectWikidata_URL;
        wikidataLink.style.display = 'inline-block';
    } else {
        wikidataLink.style.display = 'none';
    }
    
    // Tags
    if (artwork.tags && artwork.tags.length > 0) {
        populateTags(artwork.tags);
    } else {
        artworkTags.parentElement.style.display = 'none';
    }
    
    // Load related artworks
    loadRelatedArtworks(artwork.department, artwork.culture, artwork.objectID);
}

function populateAdditionalImages(images) {
    additionalImagesContainer.innerHTML = '';
    
    // Filter out empty images and limit to 5
    const validImages = images.filter(img => img && img.trim() !== '').slice(0, 5);
    
    if (validImages.length === 0) {
        additionalImagesContainer.style.display = 'none';
        return;
    }
    
    validImages.forEach((imageUrl, index) => {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'additional-image';
        img.alt = `Additional view ${index + 1}`;
        
        img.addEventListener('click', function() {
            artworkMainImage.src = imageUrl;
            
            // Update active state
            document.querySelectorAll('.additional-image').forEach(i => i.classList.remove('active'));
            img.classList.add('active');
        });
        
        // Handle image load errors
        img.addEventListener('error', function() {
            img.style.display = 'none';
        });
        
        additionalImagesContainer.appendChild(img);
    });
}

function populateTags(tags) {
    artworkTags.innerHTML = '';
    
    // Handle both array of objects and array of strings
    const tagList = Array.isArray(tags) ? tags : [];
    
    tagList.slice(0, 10).forEach(tag => {
        const tagElement = document.createElement('a');
        const tagTerm = typeof tag === 'object' ? tag.term : tag;
        
        tagElement.href = `index.html?search=${encodeURIComponent(tagTerm)}`;
        tagElement.className = 'tag';
        tagElement.textContent = tagTerm;
        artworkTags.appendChild(tagElement);
    });
    
    if (tagList.length === 0) {
        artworkTags.parentElement.style.display = 'none';
    }
}

function buildGeographyString(artwork) {
    const geoComponents = [];
    
    if (artwork.city) geoComponents.push(artwork.city);
    if (artwork.state) geoComponents.push(artwork.state);
    if (artwork.country) geoComponents.push(artwork.country);
    if (artwork.region && !geoComponents.includes(artwork.region)) {
        geoComponents.push(artwork.region);
    }
    
    return geoComponents.join(', ');
}

async function loadRelatedArtworks(department, culture, currentObjectId) {
    try {
        // Search for related artworks by department
        let searchQuery = department || 'painting';
        
        const searchUrl = `${MET_API_BASE}/search?hasImages=true&departmentId=${getDepartmentId(department)}&q=${encodeURIComponent(searchQuery)}`;
        const response = await makeApiCall(searchUrl);
        const data = await response.json();
        
        if (data.objectIDs && data.objectIDs.length > 0) {
            // Filter out current artwork and get random sample
            const filteredIds = data.objectIDs.filter(id => id !== parseInt(currentObjectId));
            const randomIds = getRandomSample(filteredIds, 6);
            
            const relatedData = await loadRelatedArtworkDetails(randomIds);
            populateRelatedArtworks(relatedData);
        }
    } catch (error) {
        console.error('Error loading related artworks:', error);
        // Hide related section if it fails
        relatedArtworks.parentElement.style.display = 'none';
    }
}

async function loadRelatedArtworkDetails(objectIds) {
    const artworks = [];
    
    for (const id of objectIds) {
        try {
            const response = await makeApiCall(`${MET_API_BASE}/objects/${id}`);
            const artwork = await response.json();
            
            if (artwork.primaryImageSmall && artwork.title) {
                artworks.push({
                    objectID: artwork.objectID,
                    title: artwork.title.length > 30 ? artwork.title.substring(0, 27) + '...' : artwork.title,
                    primaryImageSmall: artwork.primaryImageSmall
                });
            }
        } catch (error) {
            console.error(`Error loading related artwork ${id}:`, error);
        }
        
        // Break if we have enough artworks
        if (artworks.length >= 6) break;
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return artworks;
}

function populateRelatedArtworks(artworks) {
    relatedArtworks.innerHTML = '';
    
    if (artworks.length === 0) {
        relatedArtworks.parentElement.style.display = 'none';
        return;
    }
    
    artworks.forEach(artwork => {
        const relatedElement = document.createElement('a');
        relatedElement.href = `artwork-detail.html?id=${artwork.objectID}`;
        relatedElement.className = 'related-artwork';
        
        relatedElement.innerHTML = `
            <img src="${artwork.primaryImageSmall}" alt="${artwork.title}" class="related-image" onerror="this.style.display='none'">
            <div class="related-title">${artwork.title}</div>
        `;
        
        relatedArtworks.appendChild(relatedElement);
    });
}

// Utility Functions
function getDepartmentId(departmentName) {
    // Map department names to IDs (partial list)
    const departmentMap = {
        'American Decorative Arts': 1,
        'Ancient Near Eastern Art': 3,
        'Arms and Armor': 4,
        'Arts of Africa, Oceania, and the Americas': 5,
        'Asian Art': 6,
        'The Cloisters': 7,
        'The Costume Institute': 8,
        'Drawings and Prints': 9,
        'Egyptian Art': 10,
        'European Paintings': 11,
        'European Sculpture and Decorative Arts': 12,
        'Greek and Roman Art': 13,
        'Islamic Art': 14,
        'The Robert Lehman Collection': 15,
        'The Libraries': 16,
        'Medieval Art': 17,
        'Musical Instruments': 18,
        'Photographs': 19,
        'Modern Art': 21
    };
    
    return departmentMap[departmentName] || '';
}

function getRandomSample(array, size) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
}

// Image Controls
function handleImageZoom() {
    // Simple zoom implementation - could be enhanced with a proper zoom library
    const img = artworkMainImage;
    if (img.style.transform === 'scale(1.5)') {
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
    } else {
        img.style.transform = 'scale(1.5)';
        img.style.cursor = 'zoom-out';
    }
}

function handleImageFullscreen() {
    if (artworkMainImage.requestFullscreen) {
        artworkMainImage.requestFullscreen();
    } else if (artworkMainImage.webkitRequestFullscreen) {
        artworkMainImage.webkitRequestFullscreen();
    } else if (artworkMainImage.msRequestFullscreen) {
        artworkMainImage.msRequestFullscreen();
    }
}

// State Management
function showLoading() {
    detailLoading.style.display = 'flex';
    artworkDetail.style.display = 'none';
    detailError.style.display = 'none';
}

function hideLoading() {
    detailLoading.style.display = 'none';
    artworkDetail.style.display = 'grid';
}

function showError(message) {
    detailLoading.style.display = 'none';
    artworkDetail.style.display = 'none';
    detailError.style.display = 'block';
    
    const errorP = detailError.querySelector('p');
    if (errorP) {
        errorP.textContent = message;
    }
    
    // Add API status info to error display
    const errorDiv = detailError;
    let statusDiv = errorDiv.querySelector('.api-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.className = 'api-status';
        errorDiv.appendChild(statusDiv);
    }
    statusDiv.innerHTML = `<small>API Calls Made: ${apiCallCount} | Rate Limited: ${isRateLimited ? 'Yes' : 'No'}</small>`;
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

// Export for potential module use
window.ArtworkDetail = {
    loadArtworkDetails,
    showLoading,
    hideLoading,
    showError,
    getApiStatus
};
