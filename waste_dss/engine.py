import numpy as np
import hashlib

def get_deterministic_random(lat, lon, seed_offset=0):
    """Generates a deterministic float between 0 and 1 based on coordinates."""
    seed_str = f"{lat:.5f}_{lon:.5f}_{seed_offset}"
    hash_val = hashlib.md5(seed_str.encode()).hexdigest()
    return int(hash_val, 16) / (16**32)

def identify_point_type(lat, lon):
    """Identify if a point is Residential, Industrial, or Commercial."""
    val = get_deterministic_random(lat, lon, seed_offset=1)
    if val < 0.6:
        return "Residential"
    elif val < 0.85:
        return "Commercial"
    else:
        return "Industrial"

def estimate_units(lat, lon, point_type):
    """Estimate number of units based on density simulation."""
    # Simulating higher density towards a hypothetical city center (17.3850, 78.4867 for Hyderabad)
    center_lat, center_lon = 17.3850, 78.4867
    dist = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2)

    # Base density factor: higher near center, decays with distance
    density_factor = np.exp(-dist * 5) * 100 + 10

    random_variation = get_deterministic_random(lat, lon, seed_offset=2) * 0.5 + 0.75

    if point_type == "Residential":
        units = int(density_factor * 5 * random_variation)
    elif point_type == "Commercial":
        units = int(density_factor * 2 * random_variation)
    else: # Industrial
        units = int(density_factor * 0.5 * random_variation)

    return max(1, units)

def generate_waste_data(lat, lon, point_type, units):
    """Generate synthetic waste dataset."""
    rng = np.random.default_rng(int(get_deterministic_random(lat, lon, seed_offset=3) * 1e9))

    # per unit waste per day (kg)
    if point_type == "Residential":
        avg_waste = 0.5 # kg per person/unit
        hazard_base = 0.05
    elif point_type == "Commercial":
        avg_waste = 2.0
        hazard_base = 0.15
    else: # Industrial
        avg_waste = 10.0
        hazard_base = 0.4

    total_weight = units * avg_waste * rng.uniform(0.8, 1.2)

    # Category Breakdown (Plastic, Metal, Organic, Paper)
    # Proportions vary by point type
    if point_type == "Residential":
        props = [0.15, 0.05, 0.60, 0.20] # Plastic, Metal, Organic, Paper
    elif point_type == "Commercial":
        props = [0.25, 0.10, 0.30, 0.35]
    else: # Industrial
        props = [0.30, 0.40, 0.10, 0.20]

    # Add some noise to proportions
    noise = rng.uniform(-0.05, 0.05, 4)
    props = np.array(props) + noise
    props = np.clip(props, 0.01, 1.0)
    props /= props.sum()

    breakdown = {
        "Plastic": total_weight * props[0],
        "Metal": total_weight * props[1],
        "Organic": total_weight * props[2],
        "Paper": total_weight * props[3]
    }

    hazard_level = np.clip(hazard_base * rng.uniform(0.5, 1.5), 0, 1)

    return {
        "Total Weight (kg)": round(total_weight, 2),
        "Category Breakdown": {k: round(v, 2) for k, v in breakdown.items()},
        "Hazard Level": round(hazard_level, 2),
        "Point Type": point_type,
        "Estimated Units": units
    }

def get_location_profile(lat, lon):
    pt_type = identify_point_type(lat, lon)
    units = estimate_units(lat, lon, pt_type)
    return generate_waste_data(lat, lon, pt_type, units)
