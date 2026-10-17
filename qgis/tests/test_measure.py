import math
import unittest

import numpy as np

from candidates.measure import crofton_perimeter, measure
from candidates.score import context_component
from shapely.geometry import LineString


def disk(r, n=101):
    y, x = np.mgrid[0:n, 0:n] - n // 2
    return x**2 + y**2 <= r * r


class Measurements(unittest.TestCase):
    def test_disk_perimeter_and_circularity(self):
        m = disk(20)
        self.assertAlmostEqual(crofton_perimeter(m, 1.0), 2 * math.pi * 20, delta=2 * math.pi * 20 * 0.03)
        res = measure(m, np.ones(m.shape), (0, 0), 1.0, 4)
        self.assertGreater(res.circularity, 0.95)
        self.assertAlmostEqual(res.equivalent_diameter_m, 40, delta=1)

    def test_rectangle_rectangularity_and_elongation(self):
        m = np.zeros((40, 80), bool); m[10:20, 10:70] = True
        res = measure(m, -np.ones(m.shape), (0, 0), 0.5, 4)
        self.assertAlmostEqual(res.length_m, 30, delta=0.01)
        self.assertAlmostEqual(res.width_m, 5, delta=0.01)
        self.assertGreater(res.rectangularity, 0.99)
        self.assertAlmostEqual(res.elongation, 6, delta=0.01)
        self.assertLess(res.relief_m, 0)

    def test_rotated_rectangle_uses_pca_axes(self):
        y, x = np.mgrid[0:120, 0:120] - 60
        u, v = (x + y) / math.sqrt(2), (x - y) / math.sqrt(2)
        m = (np.abs(u) <= 30) & (np.abs(v) <= 5)
        res = measure(m, np.ones(m.shape), (0, 0), 1.0, 4)
        self.assertAlmostEqual(res.length_m, 61, delta=2)
        self.assertAlmostEqual(res.width_m, 11, delta=2)

    def test_ring_has_one_hole(self):
        m = disk(20) & ~disk(12)
        self.assertEqual(measure(m, np.ones(m.shape), (0, 0), 1.0, 4).holes, 1)

    def test_context_decays_linearly_and_cluster_bonus_caps_at_one(self):
        road = [LineString([(0, 0), (0, 1000)])]
        self.assertAlmostEqual(context_component(150, 500, road, False), 0.5)
        self.assertEqual(context_component(400, 500, road, False), 0.0)
        self.assertAlmostEqual(context_component(400, 500, road, True), 0.2)
        self.assertEqual(context_component(0, 500, road, True), 1.0)


if __name__ == "__main__":
    unittest.main()
