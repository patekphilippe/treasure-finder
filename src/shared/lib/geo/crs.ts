import proj4 from 'proj4';

/** PUWG 1992 — CRS of the Geoportal NMT sheets. */
export const EPSG_2180 =
  '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';

proj4.defs('EPSG:2180', EPSG_2180);

export { proj4 };
