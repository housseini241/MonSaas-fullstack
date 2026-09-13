import { useMemo, useState } from "react";
import { ALL_ACTIVITIES_LABEL } from "./constants";

/**
 * Multi-activity grouping shared by every site template.
 *
 * Artisans can declare several trades (openapi service.activity); when more
 * than one activity is present the services section exposes filter tabs.
 * Extracted from ArtisanTemplate.jsx so all templates share one implementation.
 */
export default function useServiceGrouping(site) {
  const services = (site.content || {}).services || [];
  const [activeFilter, setActiveFilter] = useState(ALL_ACTIVITIES_LABEL);

  const activities = useMemo(() => {
    const unique = [
      ...new Set(
        services
          .map((service) => service.activity || site.business_type)
          .filter(Boolean),
      ),
    ];
    return unique;
  }, [services, site.business_type]);

  const isMultiActivity = activities.length > 1;

  const filteredServices =
    !isMultiActivity || activeFilter === ALL_ACTIVITIES_LABEL
      ? services
      : services.filter(
          (service) => (service.activity || site.business_type) === activeFilter,
        );

  return {
    services,
    activities,
    isMultiActivity,
    activeFilter,
    setActiveFilter,
    filteredServices,
  };
}
