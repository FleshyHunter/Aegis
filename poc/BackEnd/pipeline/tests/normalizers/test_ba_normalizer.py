import unittest

from pipeline.normalizers.ba_normalizer import (
    group_ba_rules_by_result_code,
    latest_ba_rule_for_result_code,
    normalize_ba_list,
    normalize_ba_row,
)


class TestBANormalizer(unittest.TestCase):
    def test_normalize_ba_row_maps_real_csv_columns(self):
        raw_row = {
            "Release": " SR4 ",
            "Exception Colour": "Orange",
            "Auto Hold up?": "Yes",
            "Result Code": "ir01",
            "Exception Label(GO)": "Iris Mismatch",
            "Applicable to Profiler?": "Yes",
            "Can abort transaction in Profiler?": "No",
            "Action1_Label": "Override Scan",
            "Action2_Label": "Reject Entry",
            "Action3_Label": "Flag Spoof Attempt",
            "validity in current project": "Valid",
            "Deprecated / Invisible / Obsolete": "",
        }

        normalized = normalize_ba_row(raw_row, index=0)

        self.assertEqual(normalized["ba_rule_id"], "BA-0001")
        self.assertEqual(normalized["release"], "SR4")
        self.assertEqual(normalized["result_code"], "IR01")
        self.assertEqual(normalized["exception_colour"], "Orange")
        self.assertEqual(normalized["auto_hold_up"], "Yes")
        self.assertEqual(normalized["exception_label_go"], "Iris Mismatch")
        self.assertEqual(normalized["applicable_to_profiler"], "Yes")
        self.assertEqual(normalized["can_abort_transaction_in_profiler"], "No")
        self.assertEqual(
            normalized["action_labels"],
            ["Override Scan", "Reject Entry", "Flag Spoof Attempt"],
        )
        self.assertTrue(normalized["is_valid_in_current_project"])
        self.assertFalse(normalized["is_deprecated_or_obsolete"])
        self.assertEqual(normalized["raw_row"], raw_row)

    def test_empty_strings_are_preserved_as_none_where_possible(self):
        normalized = normalize_ba_row(
            {
                "Release": "SR4",
                "Result Code": "IR01",
                "Action1_Label": "",
                "Action2_Label": "Reject Entry",
                "Action3_Label": "",
                "validity in current project": "",
                "Deprecated / Invisible / Obsolete": "",
            }
        )

        self.assertIsNone(normalized["action1_label"])
        self.assertEqual(normalized["action2_label"], "Reject Entry")
        self.assertIsNone(normalized["action3_label"])
        self.assertEqual(normalized["action_labels"], ["Reject Entry"])
        self.assertIsNone(normalized["validity_in_current_project"])
        self.assertFalse(normalized["is_valid_in_current_project"])
        self.assertIsNone(normalized["deprecated_invisible_obsolete"])
        self.assertFalse(normalized["is_deprecated_or_obsolete"])

    def test_deprecated_invisible_obsolete_flag_is_detected(self):
        for value in ["Deprecated", "Invisible", "Obsolete", "Deprecated / Invisible"]:
            with self.subTest(value=value):
                normalized = normalize_ba_row(
                    {
                        "Release": "SR4",
                        "Result Code": "IR01",
                        "Deprecated / Invisible / Obsolete": value,
                    }
                )

                self.assertTrue(normalized["is_deprecated_or_obsolete"])

    def test_grouping_by_result_code_sorts_each_group_by_release(self):
        rules = [
            {"release": "SR4", "result_code": "IR01"},
            {"release": "SR3", "result_code": "IR01"},
            {"release": "SR2", "result_code": "IR02"},
        ]

        grouped = group_ba_rules_by_result_code(rules)

        self.assertEqual(
            [rule["release"] for rule in grouped["IR01"]],
            ["SR3", "SR4"],
        )
        self.assertEqual(grouped["IR02"][0]["release"], "SR2")

    def test_latest_rule_uses_latest_sr_release(self):
        rules = [
            {"release": "SR3", "result_code": "IR01"},
            {"release": "SR4", "result_code": "IR01"},
        ]

        latest = latest_ba_rule_for_result_code(rules)

        self.assertEqual(latest["release"], "SR4")

    def test_release_family_sorts_release_x_before_sr_x(self):
        rules = [
            {"release": "SR1", "result_code": "IR01"},
            {"release": "Release 6", "result_code": "IR01"},
            {"release": "SR10", "result_code": "IR01"},
            {"release": "SR2", "result_code": "IR01"},
        ]

        grouped = group_ba_rules_by_result_code(rules)
        latest = latest_ba_rule_for_result_code(rules)

        self.assertEqual(
            [rule["release"] for rule in grouped["IR01"]],
            ["Release 6", "SR1", "SR2", "SR10"],
        )
        self.assertEqual(latest["release"], "SR10")

    def test_normalize_ba_list_creates_latest_lookup(self):
        ba_list = {
            "id": "ba-list-1",
            "name": "BA_Rules_List.csv",
            "rows": [
                {
                    "Release": "SR3",
                    "Result Code": "IR01",
                    "Action1_Label": "Override Scan",
                },
                {
                    "Release": "SR4",
                    "Result Code": "IR01",
                    "Action1_Label": "Override Scan",
                    "Action3_Label": "Flag Spoof Attempt",
                },
                {
                    "Release": "SR4",
                    "Result Code": "IR02",
                    "Action1_Label": "Retry Capture",
                },
            ],
        }

        normalized = normalize_ba_list(ba_list)

        self.assertEqual(normalized["ba_list_id"], "ba-list-1")
        self.assertEqual(normalized["name"], "BA_Rules_List.csv")
        self.assertEqual(normalized["row_count"], 3)
        self.assertEqual(set(normalized["rules_by_result_code"].keys()), {"IR01", "IR02"})
        self.assertEqual(normalized["latest_by_result_code"]["IR01"]["release"], "SR4")
        self.assertEqual(
            normalized["latest_by_result_code"]["IR01"]["action3_label"],
            "Flag Spoof Attempt",
        )

    def test_normalize_ba_list_rejects_non_list_rows(self):
        with self.assertRaises(ValueError):
            normalize_ba_list({"id": "ba-list-1", "rows": "not-a-list"})


if __name__ == "__main__":
    unittest.main()
