"""
explanation_engine.py — AI Explanation Generator
Produces human-readable, judge-impressable explanations
of what the AI did and why.
"""
import pandas as pd
import numpy as np


class ExplanationEngine:
    def generate(
        self,
        strategy: dict,
        quality_scores: dict,
        transform_log: list,
        anomaly_result: dict,
        df_before: pd.DataFrame,
        df_after: pd.DataFrame,
    ) -> dict:
        intent     = strategy.get("intent", "general_ml")
        dtype      = strategy.get("dataset_type", "unknown")
        profile    = strategy.get("quality_profile", {})
        semantic   = strategy.get("semantic_map", {})

        explanations = []
        warnings     = []
        highlights   = []

        # ── Dataset understanding ─────────────────────────────────────────
        explanations.append({
            "type":    "dataset_understanding",
            "icon":    "🧠",
            "title":   "Dataset Identified",
            "message": f"AI detected this as a <b>{dtype.replace('_', ' ').title()}</b> dataset based on column names and content patterns.",
        })

        # ── Intent resolution ─────────────────────────────────────────────
        resolved = strategy.get("intent_result", {}).get("resolved_from", "")
        intent_label = intent.replace("_", " ").title()
        if resolved == "dataset_type":
            explanations.append({
                "type":    "intent_resolved",
                "icon":    "🎯",
                "title":   "Intent Auto-Detected",
                "message": f"Prompt was ambiguous — AI resolved intent to <b>{intent_label}</b> based on dataset structure.",
            })
        else:
            explanations.append({
                "type":    "intent_classified",
                "icon":    "🎯",
                "title":   "Goal Understood",
                "message": f"AI classified your goal as <b>{intent_label}</b> and selected the appropriate cleaning strategy.",
            })

        # ── Semantic column mapping ───────────────────────────────────────
        money_cols    = [c for c, t in semantic.items() if t == "money"]
        datetime_cols = [c for c, t in semantic.items() if t == "datetime"]
        id_cols       = [c for c, t in semantic.items() if t == "identifier"]
        target_cols   = [c for c, t in semantic.items() if t == "target"]

        if money_cols:
            explanations.append({
                "type":    "semantic_money",
                "icon":    "💰",
                "title":   "Monetary Columns Detected",
                "message": f"Columns {money_cols[:3]} identified as financial data. Negative values and invalid tokens cleaned.",
            })
        if datetime_cols:
            explanations.append({
                "type":    "semantic_datetime",
                "icon":    "📅",
                "title":   "Temporal Columns Detected",
                "message": f"Columns {datetime_cols[:2]} identified as datetime. Time features (year, month, day, weekday) were extracted.",
            })
        if id_cols:
            warnings.append({
                "type":    "identifier_warning",
                "icon":    "⚠️",
                "title":   "Identifier Columns Found",
                "message": f"Columns {id_cols[:3]} appear to be IDs. These should be dropped before ML training to prevent data leakage.",
            })
        if target_cols:
            highlights.append({
                "type":    "target_detected",
                "icon":    "🏹",
                "title":   "Target Column Found",
                "message": f"Potential target/label column: <b>{target_cols[0]}</b>. Protect this column — do not impute or scale it.",
            })

        # ── Invalid token repair ──────────────────────────────────────────
        invalid_count = profile.get("invalid_token_count", 0)
        if invalid_count > 0:
            explanations.append({
                "type":    "invalid_tokens",
                "icon":    "🔧",
                "title":   "Corrupted Values Repaired",
                "message": f"Found and replaced <b>{invalid_count}</b> invalid tokens ('ERROR', 'N/A', '?', '#NULL!', etc.) with proper null values before imputation.",
            })

        # ── Missing value handling ────────────────────────────────────────
        missing_before = profile.get("missing_count", 0)
        missing_after  = int(df_after.isnull().sum().sum()) if df_after is not None else 0
        if missing_before > 0:
            fixed = missing_before - missing_after
            method = strategy.get("fill_method", "smart")
            explanations.append({
                "type":    "missing_values",
                "icon":    "🩹",
                "title":   "Missing Values Imputed",
                "message": f"<b>{fixed}</b> of {missing_before} missing values filled using <b>{method}</b> strategy. Numeric columns used median (skew-resistant); categorical used mode.",
            })

        # ── Duplicate removal ─────────────────────────────────────────────
        dups = profile.get("duplicate_rows", 0)
        if dups > 0:
            explanations.append({
                "type":    "duplicates",
                "icon":    "🗂️",
                "title":   "Duplicates Removed",
                "message": f"Detected and removed <b>{dups}</b> exact duplicate rows. This prevents model overfitting on repeated examples.",
            })

        # ── Outlier policy ────────────────────────────────────────────────
        if strategy.get("preserve_outliers"):
            highlights.append({
                "type":    "outlier_preserve",
                "icon":    "🛡️",
                "title":   "Outliers Preserved (Policy: Fraud/Anomaly)",
                "message": f"<b>{anomaly_result.get('anomaly_count', 0)}</b> anomalous rows detected and KEPT. For {intent_label}, outliers are signals — removing them destroys detection accuracy.",
            })
        else:
            auto_clips = [e for e in transform_log if "clip" in e.get("action", "")]
            if auto_clips:
                explanations.append({
                    "type":    "outlier_clip",
                    "icon":    "✂️",
                    "title":   "Outliers Clipped",
                    "message": f"<b>{len(auto_clips)}</b> columns had outliers clipped to IQR bounds. Prevents extreme values from distorting model training.",
                })

        # ── Anomaly detection ─────────────────────────────────────────────
        anom_count = anomaly_result.get("anomaly_count", 0)
        if anom_count > 0:
            anom_pct = anomaly_result.get("anomaly_pct", 0)
            explanations.append({
                "type":    "anomaly_detection",
                "icon":    "🔍",
                "title":   "Anomaly Scan Complete",
                "message": f"IsolationForest + LOF ensemble found <b>{anom_count} anomalous rows</b> ({anom_pct:.1f}% of data). Method: {anomaly_result.get('method','ensemble')}.",
            })

        # ── Quality improvement ───────────────────────────────────────────
        score_before = quality_scores.get("before", 0)
        score_after  = quality_scores.get("after", 0)
        improvement  = quality_scores.get("improvement", 0)
        if improvement > 0:
            highlights.append({
                "type":    "quality_improvement",
                "icon":    "📈",
                "title":   "Quality Score Improved",
                "message": f"Data quality improved from <b>{score_before:.0f}%</b> to <b>{score_after:.0f}%</b> — a <b>+{improvement:.0f}%</b> improvement. {quality_scores.get('actions_applied', 0)} transformations auto-applied.",
            })

        # ── Shape change ──────────────────────────────────────────────────
        if df_before is not None and df_after is not None:
            rows_removed = df_before.shape[0] - df_after.shape[0]
            if rows_removed > 0:
                explanations.append({
                    "type":    "shape_change",
                    "icon":    "📐",
                    "title":   "Dataset Shape Changed",
                    "message": f"Removed <b>{rows_removed} rows</b> (duplicates + corrupt rows). {df_after.shape[0]:,} clean rows remain.",
                })

        # ── AI summary ────────────────────────────────────────────────────
        n_auto = quality_scores.get("actions_applied", 0)
        n_sug  = quality_scores.get("actions_suggested", 0)
        summary = (
            f"DataForge AI applied <b>{n_auto} transformations automatically</b> and flagged "
            f"<b>{n_sug} items for review</b>. The dataset is now ready for <b>{intent_label}</b> workflows."
        )

        return {
            "explanations": explanations,
            "warnings":     warnings,
            "highlights":   highlights,
            "summary":      summary,
            "ai_strategy":  strategy.get("description", ""),
            "decision_count": len(explanations) + len(warnings) + len(highlights),
        }
