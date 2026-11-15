export interface GroundStationNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  elevationM: number;
  dishDiameterM: number;
}

export const GROUND_STATIONS: GroundStationNode[] = [
  { id: "bengaluru", name: "Bengaluru Gateway", lat: 12.9716, lng: 77.5946, country: "India", elevationM: 920, dishDiameterM: 11.0 },
  { id: "delhi", name: "New Delhi Teleport", lat: 28.6139, lng: 77.2090, country: "India", elevationM: 216, dishDiameterM: 9.0 },
  { id: "singapore", name: "Singapore Equator Hub", lat: 1.3521, lng: 103.8198, country: "Singapore", elevationM: 15, dishDiameterM: 7.3 },
  { id: "london", name: "London Goonhilly Earth Station", lat: 51.5074, lng: -0.1278, country: "United Kingdom", elevationM: 25, dishDiameterM: 13.0 },
  { id: "tokyo", name: "Tokyo Space Center", lat: 35.6762, lng: 139.6503, country: "Japan", elevationM: 40, dishDiameterM: 10.0 },
  { id: "newyork", name: "New York Deep Space Node", lat: 40.7128, lng: -74.0060, country: "United States", elevationM: 10, dishDiameterM: 12.0 },
  { id: "sydney", name: "Canberra / Sydney Tracking Station", lat: -33.8688, lng: 151.2093, country: "Australia", elevationM: 580, dishDiameterM: 15.0 },
];
