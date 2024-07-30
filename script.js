// Configuration Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiY3liZXJwdW5rOCIsImEiOiJjbHo4aTd3d3kwMHp0MmtzYTExNWxiM2hjIn0.U6TvUSkuUJBIjPfex-1qkA';

// Initialisation de la carte
const map = new mapboxgl.Map({
    container: 'map', // ID du conteneur HTML
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0], // Coordonnées par défaut
    zoom: 2 // Niveau de zoom par défaut
});

const markers = [];

// Classe pour modéliser les événements locaux
class LocalEvent {
    constructor(title, description, startDate, endDate, latitude, longitude) {
        this.title = title;
        this.description = description;
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
        this.latitude = parseFloat(latitude);
        this.longitude = parseFloat(longitude);
    }

    getStatusMessage() {
        const now = new Date();
        const diff = this.startDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 3) return '';
        if (days <= 3 && days >= 0) return `Attention, commence dans ${days} jours et ${hours} heures`;
        return 'Quel dommage ! Vous avez raté cet événement !';
    }

    getMarkerColor() {
        const now = new Date();
        const diff = this.startDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 3) return 'green';
        if (days <= 3 && days >= 0) return 'orange';
        return 'red';
    }
}

// Fonction pour créer un marqueur
function createMarker(event) {
    const markerColor = event.getMarkerColor();
    const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([event.longitude, event.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${event.title}</h3>
                      <p>${event.description}</p>
                      <p>Start: ${event.startDate.toLocaleString()}</p>
                      <p>End: ${event.endDate.toLocaleString()}</p>
                      <p>${event.getStatusMessage()}</p>`))
        .addTo(map);
    markers.push(marker);
}

// Fonction pour sauvegarder les événements dans localStorage
function saveEvents() {
    const events = markers.map(marker => {
        const lngLat = marker.getLngLat();
        const popup = marker.getPopup();
        const html = popup.getHTML();
        const title = html.match(/<h3>(.*?)<\/h3>/)[1];
        const description = html.match(/<p>(.*?)<\/p>/)[1];
        const startDate = new Date(html.match(/Start: (.*?)<\/p>/)[1]).toISOString();
        const endDate = new Date(html.match(/End: (.*?)<\/p>/)[1]).toISOString();
        return new LocalEvent(title, description, startDate, endDate, lngLat.lat, lngLat.lng);
    });
    localStorage.setItem('events', JSON.stringify(events));
}

// Fonction pour charger les événements depuis localStorage
function loadEvents() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    events.forEach(eventData => {
        const event = new LocalEvent(
            eventData.title, 
            eventData.description, 
            eventData.startDate, 
            eventData.endDate, 
            eventData.latitude, 
            eventData.longitude
        );
        createMarker(event);
    });
}

// Initialiser la carte avec les événements sauvegardés
map.on('load', () => {
    loadEvents();
    map.on('click', (e) => {
        document.getElementById('latitude').value = e.lngLat.lat;
        document.getElementById('longitude').value = e.lngLat.lng;
    });
});

// Gestion du formulaire
document.getElementById('event-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;

    const event = new LocalEvent(title, description, startDate, endDate, latitude, longitude);
    createMarker(event);
    saveEvents();
});

// Mise à jour des informations sur la carte
document.getElementById('update-button').addEventListener('click', () => {
    markers.forEach(marker => marker.remove());
    markers.length = 0;
    loadEvents();
});
