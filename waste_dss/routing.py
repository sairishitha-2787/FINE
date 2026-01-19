import numpy as np
import networkx as nx

def calculate_distance(p1, p2):
    """Euclidean distance between two lat/lon points (simplified for small areas)."""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

class ACO_TSP:
    def __init__(self, points, n_ants=10, n_iterations=50, alpha=1, beta=2, evaporation_rate=0.5, Q=100):
        self.points = points
        self.n_points = len(points)
        self.n_ants = n_ants
        self.n_iterations = n_iterations
        self.alpha = alpha
        self.beta = beta
        self.evaporation_rate = evaporation_rate
        self.Q = Q

        self.dist_matrix = np.zeros((self.n_points, self.n_points))
        for i in range(self.n_points):
            for j in range(self.n_points):
                if i != j:
                    self.dist_matrix[i][j] = calculate_distance(points[i], points[j])
                else:
                    self.dist_matrix[i][j] = 1e-9 # Avoid division by zero

        self.pheromones = np.ones((self.n_points, self.n_points))

    def run(self):
        best_path = None
        best_dist = float('inf')

        for _ in range(self.n_iterations):
            paths = self.generate_paths()
            self.update_pheromones(paths)

            for path, dist in paths:
                if dist < best_dist:
                    best_dist = dist
                    best_path = path

        return best_path, best_dist

    def generate_paths(self):
        paths = []
        for _ in range(self.n_ants):
            path = self.generate_path()
            dist = self.calculate_path_dist(path)
            paths.append((path, dist))
        return paths

    def generate_path(self):
        path = [np.random.randint(self.n_points)]
        visited = set(path)

        while len(path) < self.n_points:
            i = path[-1]
            probs = self.calculate_probabilities(i, visited)
            next_point = np.random.choice(range(self.n_points), p=probs)
            path.append(next_point)
            visited.add(next_point)

        return path

    def calculate_probabilities(self, i, visited):
        tau = self.pheromones[i]
        eta = 1 / self.dist_matrix[i]

        mask = np.ones(self.n_points, dtype=bool)
        mask[list(visited)] = False

        if not any(mask):
            return np.zeros(self.n_points)

        num = (tau[mask] ** self.alpha) * (eta[mask] ** self.beta)
        probs = np.zeros(self.n_points)
        probs[mask] = num / num.sum()
        return probs

    def calculate_path_dist(self, path):
        dist = 0
        for i in range(len(path) - 1):
            dist += self.dist_matrix[path[i]][path[i+1]]
        dist += self.dist_matrix[path[-1]][path[0]] # Return to start
        return dist

    def update_pheromones(self, paths):
        self.pheromones *= (1 - self.evaporation_rate)
        for path, dist in paths:
            contribution = self.Q / dist
            for i in range(len(path) - 1):
                self.pheromones[path[i]][path[i+1]] += contribution
            self.pheromones[path[-1]][path[0]] += contribution

def get_optimized_route(points):
    if len(points) < 2:
        return list(range(len(points))), 0
    if len(points) > 15: # Limit ACO for performance, use simple greedy or something else if needed
        # but 15 is fine for ACO
        pass

    aco = ACO_TSP(points)
    return aco.run()

def calculate_savings(static_dist, optimized_dist):
    # conversion factors (hypothetical)
    # 1 degree lat/lon is roughly 111km.
    km_static = static_dist * 111
    km_optimized = optimized_dist * 111

    fuel_per_km = 0.3 # liters
    avg_speed = 30 # km/h

    fuel_saved = (km_static - km_optimized) * fuel_per_km
    time_saved = (km_static - km_optimized) / avg_speed

    # trips saved - assume 1 trip per 100km or something
    trips_saved = max(0, int((km_static - km_optimized) / 50))

    return {
        "Fuel Saved (Liters)": round(max(0, fuel_saved), 2),
        "Time Saved (Hours)": round(max(0, time_saved), 2),
        "Trips Saved": trips_saved,
        "Static Distance (km)": round(km_static, 2),
        "Optimized Distance (km)": round(km_optimized, 2)
    }
