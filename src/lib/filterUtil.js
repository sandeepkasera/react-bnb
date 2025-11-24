/**
 * Filter properties based on filter criteria
 * @param  {Array} properties - Array of all properties
 * @param  {Object} filters - The filters being applied to the properties
 * @return {Array} - Array of properties that match the given filters
 */
export const filterProperties = (properties, filters) => {
  if (!properties || !properties.length) {
    return [];
  }

  const {
    locationFilter,
    rateFilter,
    starsFilter,
    houseTypeFilter,
    placeTypeFilter,
    superHostFilter,
  } = filters;
  const houseTypeSet = new Set(houseTypeFilter);
  const placeTypeSet = new Set(placeTypeFilter);

  // Precompute host averages once (O(n)) to maintain O(n) complexity for the entire filter
  const hostAverages = superHostFilter ? computeHostAverages(properties) : null;

  const failsRangeCheck = (range, field) => range && (range[0] > field || range[1] < field);
  const failsSetCheck = (set, field) => set.size > 0 && !set.has(field);

  return properties.filter((property) => {
    if (locationFilter && locationFilter !== property.country) {
      return false;
    }

    if (superHostFilter && !isSuperHost(property, hostAverages)) {
      return false;
    }

    if (
      failsRangeCheck(rateFilter, property.rate) ||
      failsRangeCheck(starsFilter, property.stars)
    ) {
      return false;
    }

    if (
      failsSetCheck(houseTypeSet, property.houseType) ||
      failsSetCheck(placeTypeSet, property.placeType)
    ) {
      return false;
    }

    return true;
  });
};

/**
* Compute average star ratings for each host (O(n) operation).
 * Returns a Map where keys are hostIds and values are their average star ratings.
 * @param {Array} allProperties - Array of all properties
 * @return {Map} - Map of hostId -> average star rating
 */
function computeHostAverages(allProperties) {
  const hostStats = new Map();

  for (const property of allProperties) {
    if (!hostStats.has(property.hostId)) {
      hostStats.set(property.hostId, { totalStars: 0, count: 0 });
    }
    const stats = hostStats.get(property.hostId);
    stats.totalStars += property.stars;
    stats.count += 1;
  }

  // Convert to a map of hostId -> average
  const hostAverages = new Map();
  for (const [hostId, stats] of hostStats) {
    hostAverages.set(hostId, stats.totalStars / stats.count);
  }

  return hostAverages;
}

/**
 * Determine if the host of the specified `property` is a "Super Host". A Super Host is a host with an average star
 * rating of 4 or more across all of their properties.
 * @param {Object} property - The property currently being checked for "Super Host" status
 * @param {Map} hostAverages - Map of hostId -> average star rating (precomputed)
 * @return {Boolean} - true if the host of `property` is a "Super Host". Otherwise false.
 */
function isSuperHost(property, hostAverages) {
  if (!hostAverages) {
    return false;
  }
  const average = hostAverages.get(property.hostId);
  return average !== undefined && average >= 4;
}

export const RATE_FILTER_META = {
  MIN: 0,
  MAX: 2000,
};

export const STAR_FILTER_META = {
  MIN: 0,
  MAX: 5,
};

export const DEFAULT_FILTERS = {
  locationFilter: null,
  placeTypeFilter: [],
  houseTypeFilter: [],
  superHostFilter: false,
  rateFilter: [RATE_FILTER_META.MIN, RATE_FILTER_META.MAX],
  starsFilter: [STAR_FILTER_META.MIN, STAR_FILTER_META.MAX],
};
