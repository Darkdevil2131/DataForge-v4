"""
brain_engine.py — DataForge AI Central Orchestrator
Implements the full Intent-Aware Autonomous Data Preparation pipeline.
Dataset understanding + intent + semantic analysis → dynamic strategy.
"""
import pandas as pd
import numpy as np
import re
from typing import Any

SEMANTIC_GROUPS = {
    "money":      ["price", "amount", "revenue", "salary", "income", "spent", "cost", "sales", "payment", "charge", "fee", "tax", "discount", "total", "subtotal", "balance"],
    "datetime":   ["date", "time", "timestamp", "created_at", "updated_at", "datetime", "period", "year", "month", "day", "week", "quarter"],
    "identifier": ["id", "uuid", "guid", "customer_id", "transaction_id", "order_id", "user_id", "invoice", "ref", "code", "no", "num", "index"],
    "target":     ["target", "label", "class", "fraud", "churn", "survived", "diagnosis", "default", "spam", "y", "output", "result", "outcome"],
    "text":       ["description", "comment", "review", "text", "message", "note", "subject", "content", "title", "name", "address"],
    "geographic": ["country", "city", "state", "region", "zip", "postal", "lat", "lon", "location", "territory"],
    "categorical":["type", "category", "gender", "status", "grade", "level", "tier", "segment", "group"],
}

INVALID_TOKENS = [
    "ERROR", "error", "UNKNOWN", "unknown", "NULL", "null",
    "N/A", "n/a", "NA", "na", "NaN", "NAN", "nan",
    "MISSING", "missing", "NONE", "none",
    "?", "-", "--", "---", "#", "##",
    "#N/A", "#NULL!", "#VALUE!", "#REF!", "#DIV/0!", "#NAME?",
    "not available", "Not Available", "NOT AVAILABLE",
    "not applicable", "Not Applicable",
    "", " ", "  ",
]


class BrainEngine:
    def __init__(self, intent_classifier):
        self.intent_classifier = intent_classifier

    def detect_dataset_type(self, df: pd.DataFrame) -> str:
        """Detect dataset domain from column names and content."""
        cols = " ".join(c.lower() for c in df.columns)
        sample_vals = " ".join(str(v).lower() for col in df.select_dtypes("object").columns
                               for v in df[col].dropna().head(5))
        combined = cols + " " + sample_vals

        rules = [
            ("fraud_detection",   ["fraud", "transaction", "fraudulent", "suspicious"]),
            ("customer_churn",    ["churn", "tenure", "contract", "subscription", "cancel"]),
            ("sales_analytics",   ["invoice", "invoice_no", "stockcode", "unitprice", "sales", "retail", "order", "purchase"]),
            ("time_series",       ["date", "timestamp", "time", "datetime", "period"]),
            ("medical",           ["diagnosis", "patient", "disease", "symptom", "clinical", "hospital"]),
            ("nlp",               ["review", "text", "comment", "sentiment", "tweet", "description"]),
            ("ecommerce",         ["product", "cart", "order", "customer", "purchase", "item"]),
            ("financial",         ["stock", "price", "close", "open", "high", "low", "volume", "ticker"]),
        ]
        for dtype, keywords in rules:
            if any(k in combined for k in keywords):
                return dtype
        return "general_ml"

    def detect_semantic_types(self, df: pd.DataFrame) -> dict:
        """Map each column to a semantic type."""
        semantic_map = {}
        for col in df.columns:
            lower = col.lower().replace(" ", "_").replace("-", "_")
            semantic_map[col] = "general"
            for sem_type, keywords in SEMANTIC_GROUPS.items():
                if any(k in lower for k in keywords):
                    semantic_map[col] = sem_type
                    break
        return semantic_map

    def profile_data_quality(self, df: pd.DataFrame) -> dict:
        """Deep data quality profiling."""
        total_cells = df.shape[0] * df.shape[1]
        issues = {
            "missing_count":   int(df.isnull().sum().sum()),
            "duplicate_rows":  int(df.duplicated().sum()),
            "total_rows":      int(df.shape[0]),
            "total_cols":      int(df.shape[1]),
        }
        # Count invalid tokens across string columns
        invalid_count = 0
        for col in df.select_dtypes("object").columns:
            for token in INVALID_TOKENS[:15]:
                try:
                    invalid_count += int((df[col].astype(str).str.strip() == token).sum())
                except Exception:
                    pass
        issues["invalid_token_count"] = invalid_count

        # Detect columns that look numeric but stored as strings
        mixed_cols = []
        for col in df.select_dtypes("object").columns:
            converted = pd.to_numeric(df[col].astype(str).str.strip().str.replace(",", "").str.replace("$", ""), errors="coerce")
            ratio = converted.notna().sum() / max(len(df[col].dropna()), 1)
            if 0.6 < ratio < 1.0:
                mixed_cols.append(col)
        issues["mixed_type_cols"] = mixed_cols
        issues["quality_score_before"] = round(max(0, 100 - (
            (issues["missing_count"] / max(total_cells, 1)) * 40 +
            (issues["duplicate_rows"] / max(df.shape[0], 1)) * 30 +
            min(issues["invalid_token_count"] / max(total_cells, 1) * 30, 30)
        )), 1)
        return issues

    def build_strategy(self, df: pd.DataFrame, prompt: str) -> dict:
        """Build complete cleaning strategy from dataset + prompt."""
        # Handle very short prompts
        if len(prompt.strip()) < 8:
            prompt = f"clean and prepare this dataset for machine learning: {prompt}"

        intent_result = self.intent_classifier.classify(prompt)
        intent = intent_result["intent"]
        dataset_type = self.detect_dataset_type(df)
        semantic_map = self.detect_semantic_types(df)
        quality_profile = self.profile_data_quality(df)

        # Resolve intent from dataset type if classifier is uncertain
        if intent_result["confidence"] < 0.4:
            type_to_intent = {
                "fraud_detection": "fraud_detection",
                "customer_churn":  "classification",
                "sales_analytics": "analytics",
                "time_series":     "forecasting",
                "medical":         "classification",
                "nlp":             "nlp",
                "ecommerce":       "analytics",
                "financial":       "forecasting",
            }
            if dataset_type in type_to_intent:
                intent = type_to_intent[dataset_type]
                intent_result["intent"] = intent
                intent_result["confidence"] = 0.75
                intent_result["resolved_from"] = "dataset_type"

        strategy = {
            "intent":                intent,
            "dataset_type":          dataset_type,
            "semantic_map":          semantic_map,
            "quality_profile":       quality_profile,
            "preserve_outliers":     False,
            "fill_method":           "smart",
            "generate_features":     True,
            "remove_duplicates":     True,
            "normalize_numeric":     True,
            "explanation_mode":      True,
            "risk_notes":            [],
            "large_file":            df.shape[0] > 50000,
        }

        # Intent-specific rules
        if intent == "forecasting":
            strategy.update({
                "fill_method":              "forward_fill",
                "preserve_temporal_order":  True,
                "preserve_outliers":        True,
                "generate_time_features":   True,
                "normalize_numeric":        False,
                "risk_notes":               ["Never shuffle time-series data", "Preserve timestamp column"],
            })
        elif intent == "fraud_detection":
            strategy.update({
                "preserve_outliers":  True,
                "high_sensitivity":   True,
                "fill_method":        "median",
                "normalize_numeric":  False,
                "risk_notes":         ["Outliers are SIGNALS — never remove", "Class imbalance expected — use SMOTE"],
            })
        elif intent == "classification":
            strategy.update({
                "encode_categories":  True,
                "balance_classes":    True,
                "fill_method":        "smart",
                "normalize_numeric":  True,
                "risk_notes":         ["Check class imbalance", "Encode all categoricals"],
            })
        elif intent == "analytics":
            strategy.update({
                "fill_method":        "mode",
                "normalize_numeric":  False,
                "generate_features":  False,
                "risk_notes":         ["Focus on aggregation quality", "Preserve original values for BI"],
            })
        elif intent == "nlp":
            strategy.update({
                "normalize_text":    True,
                "fill_method":       "mode",
                "normalize_numeric": False,
                "risk_notes":        ["Text normalization applied", "Encoding consistency important"],
            })

        return {
            "intent_result":  intent_result,
            "strategy":       strategy,
            "dataset_type":   dataset_type,
            "quality_profile": quality_profile,
        }

    def get_policy(self, strategy: dict) -> dict:
        """Convert strategy to noise engine policy format."""
        return {
            "preserve_outliers":   strategy.get("preserve_outliers", False),
            "aggressive_cleaning": not strategy.get("preserve_outliers", False),
            "balance_classes":     strategy.get("balance_classes", False),
            "normalize_skew":      strategy.get("normalize_numeric", True),
            "description":         self._policy_description(strategy),
            "risk_notes":          strategy.get("risk_notes", []),
        }

    def _policy_description(self, strategy: dict) -> str:
        intent = strategy.get("intent", "general_ml")
        dtype  = strategy.get("dataset_type", "unknown")
        labels = {
            "fraud_detection": "Fraud-safe: outliers preserved as anomaly signals.",
            "forecasting":     "Time-series: chronological order preserved, forward fill applied.",
            "classification":  "Classification: standard cleaning + categorical encoding.",
            "analytics":       "Analytics: aggregation-ready, BI-optimized output.",
            "nlp":             "NLP: text normalization + encoding repair applied.",
            "general_ml":      "Standard ML pipeline: smart imputation + scaling.",
        }
        desc = labels.get(intent, "Context-aware cleaning applied.")
        if dtype != "general_ml":
            desc += f" Dataset identified as {dtype.replace('_',' ')} type."
        return desc
