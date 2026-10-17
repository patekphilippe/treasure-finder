"""Acceptance tests from docs/PLAN.md, Etap 1 "Testy"."""
import unittest

from osgeo import osr

from candidates.pipeline import analyse
from tests import terrain as t


def run(dem):
    return analyse(t.grid(dem), "TEST").candidates


class SyntheticTerrain(unittest.TestCase):
    def test_tilted_plane_with_gaussian_mound_gives_one_protected_mound(self):
        found = run(t.plane(2) + t.gaussian_mound(height=1.0, radius=8.0))
        self.assertEqual([c["form"] for c in found], ["kopiec_okragly"])
        self.assertTrue(found[0]["protectedLikely"])

    def test_cone_crater_gives_one_round_depression(self):
        found = run(t.plane(2) + t.cone_crater(depth=1.5, diameter=8.0))
        self.assertEqual([c["form"] for c in found], ["zaglebienie_okragle"])
        self.assertFalse(found[0]["protectedLikely"])

    def test_trench_gives_one_linear_ditch(self):
        found = run(t.plane(2) + t.trench(width=1.5, length=60, depth=0.8))
        self.assertEqual([c["form"] for c in found], ["row_liniowy"])
        self.assertAlmostEqual(found[0]["widthM"], 1.5, delta=0.5)
        self.assertAlmostEqual(found[0]["lengthM"], 60, delta=3)

    def test_noise_below_threshold_gives_nothing(self):
        self.assertEqual(run(t.plane(2) + t.noise(sigma=0.05)), [])

    def test_ring_is_protected(self):
        found = run(t.plane(1) + t.ring())
        rings = [c for c in found if c["form"] == "pierscien"]
        self.assertEqual(len(rings), 1)
        self.assertTrue(rings[0]["protectedLikely"])

    def test_tilted_plane_edges_do_not_create_candidates(self):
        self.assertEqual(run(t.plane(5)), [])

    def test_candidate_matches_app_model_and_location(self):
        c = run(t.plane(2) + t.cone_crater())[0]
        self.assertEqual(set(c), {"id", "sheetId", "form", "lat", "lng", "areaM2", "lengthM", "widthM", "reliefM",
                                  "circularity", "elongation", "rectangularity", "score", "protectedLikely",
                                  "decision", "note"})
        self.assertEqual(c["decision"], "nowy")
        self.assertTrue(0 <= c["score"] <= 100)
        # crater centre = cell centre (500 050, 399 950) in EPSG:2180
        src = osr.SpatialReference(); src.ImportFromEPSG(2180)
        dst = osr.SpatialReference(); dst.ImportFromEPSG(4326)
        for s in (src, dst):
            s.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        lng, lat, _ = osr.CoordinateTransformation(src, dst).TransformPoint(500_050, 399_950)
        self.assertAlmostEqual(c["lng"], lng, places=6)
        self.assertAlmostEqual(c["lat"], lat, places=6)


if __name__ == "__main__":
    unittest.main()
