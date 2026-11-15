import * as THREE from "three";

/**
 * Converts latitude and longitude coordinates into a 3D position vector on a sphere.
 * Matching Three.js sphere coordinate orientation.
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Converts a 3D vector on a sphere back into latitude and longitude coordinates.
 */
export function vector3ToLatLng(position: THREE.Vector3): { lat: number; lng: number } {
  const norm = position.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, norm.y)));
  const lat = 90 - (phi * 180) / Math.PI;
  const theta = Math.atan2(norm.z, -norm.x);
  let lng = (theta * 180) / Math.PI - 180;
  if (lng < -180) lng += 360;
  if (lng > 180) lng -= 360;
  return { lat, lng };
}

/**
 * Calculates great-circle angular distance in radians between two lat/lng coordinates.
 */
export function greatCircleDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  return Math.acos(
    Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl)
  );
}
