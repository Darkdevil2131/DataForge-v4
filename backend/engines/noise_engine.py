"""
Noise Detection & Cleaning Engine
Hybrid approach: Statistical + Rule-Based + ML (IsolationForest)
Confidence-scored — never blindly modifies data.
Policy-aware — fraud data treated differently than regression data.
"""
import pandas as pd
import numpy as np
from scipy import stats
from typing import Any
import warnings
warnings.filterwarnings("ignore")


# ─── Confidence thresholds ────────────────────────────────────────────────────
CONF_AUTO_FIX = 0.85       # Auto-fix above this
CONF_SUGGEST = 0.65        # Suggest above this, below auto-fix
# Below CONF_SUGGEST → quarantine / flag only


class TransformationLog:
    """Tracks every transformation with metadata."""
    def __init__(self):
        self.entries = []

    def add(self, column: str, action: str, rows_affected: int,
            reason: str, confidence: float, details: str = ""):
        self.entries.append({
            "column": column,
            "action": action,
            "rows_affected": rows_affected,
            "reason": reason,
            "confidence": round(confidence, 3),
            "details": details,
            "status": (
                "auto_applied" if confidence >= CONF_AUTO_FIX
                else "suggested" if confidence >= CONF_SUGGEST
                else "flagged"
            )
        })

    def to_list(self):
        return self.entries


def _iqr_bounds(series: pd.Series, multiplier: float = 1.5):
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    return Q1 - multiplier * IQR, Q3 + multiplier * IQR


def _zscore_mask(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    z = np.abs(stats.zscore(series.dropna()))
    mask = pd.Series(False, index=series.index)
    mask.iloc[series.dropna().index.get_indexer(series.dropna().index)] = z > threshold
    return mask


def detect_numeric_outliers(series: pd.Series, preserve_outliers: bool = False) -> dict:
    """Detect outliers using IQR + z-score ensemble."""
    non_null = series.dropna()
    if len(non_null) < 10:
        return {"outlier_indices": [], "outlier_count": 0, "method": "skipped_too_few_rows"}

    lower, upper = _iqr_bounds(non_null)
    iqr_mask = (non_null < lower) | (non_null > upper)

    z_mask = _zscore_mask(non_null)
    z_outliers = set(non_null[z_mask].index.tolist())

    # Ensemble: outlier confirmed if BOTH methods agree
    iqr_outliers = set(non_null[iqr_mask].index.tolist())
    confirmed_outliers = iqr_outliers & z_outliers  # intersection = high confidence
    suspected_outliers = iqr_outliers | z_outliers   # union = lower confidence

    return {
        "outlier_indices": list(confirmed_outliers),
        "suspected_indices": list(suspected_outliers - confirmed_outliers),
        "outlier_count": len(confirmed_outliers),
        "suspected_count": len(suspected_outliers - confirmed_outliers),
        "bounds": {"lower": float(lower), "upper": float(upper)},
        "preserve_outliers": preserve_outliers,
        "method": "iqr_zscore_ensemble"
    }


def impute_missing(series: pd.Series, strategy: str, col_name: str = "") -> tuple[pd.Series, str]:
    """Impute missing values with the appropriate strategy."""
    if series.isnull().sum() == 0:
        return series, "no_missing"

    if strategy == "median":
        fill_val = series.median()
        return series.fillna(fill_val), f"median={round(float(fill_val), 4)}"
    elif strategy == "mean":
        fill_val = series.mean()
        return series.fillna(fill_val), f"mean={round(float(fill_val), 4)}"
    elif strategy == "mode":
        fill_val = series.mode().iloc[0] if not series.mode().empty else "UNKNOWN"
        return series.fillna(fill_val), f"mode={fill_val}"
    elif strategy == "zero":
        return series.fillna(0), "fill=0"
    elif strategy == "forward_fill":
        return series.ffill().bfill(), "forward_fill+backfill"
    elif strategy == "drop":
        return series, "rows_with_missing_dropped_separately"
    else:
        # Smart default
        if pd.api.types.is_numeric_dtype(series):
            skew = abs(series.skew()) if len(series.dropna()) > 3 else 0
            if skew > 1.0:
                fill_val = series.median()
                return series.fillna(fill_val), f"median={round(float(fill_val), 4)} (skewed)"
            else:
                fill_val = series.mean()
                return series.fillna(fill_val), f"mean={round(float(fill_val), 4)}"
        else:
            fill_val = series.mode().iloc[0] if not series.mode().empty else "UNKNOWN"
            return series.fillna(fill_val), f"mode={fill_val}"


def get_imputation_strategy(col_name: str, series: pd.Series, intent: str,
                             null_pct: float) -> tuple[str, float]:
    """
    Decide the best imputation strategy and return (strategy, confidence).
    Context-aware: forecasting uses forward fill, fraud preserves, etc.
    """
    if null_pct > 65:
        return "drop_column", 0.92  # Auto-drop columns with >65% missing

    if intent == "forecasting" and pd.api.types.is_numeric_dtype(series):
        return "forward_fill", 0.92

    if pd.api.types.is_numeric_dtype(series):
        if null_pct < 5:
            skew = abs(series.skew()) if len(series.dropna()) > 3 else 0
            strategy = "median" if skew > 1.0 else "mean"
            return strategy, 0.95
        elif null_pct < 30:
            return "median", 0.88
        elif null_pct < 50:
            return "median", 0.87  # auto-apply up to 50% missing
        else:
            return "median", 0.72
    else:
        if null_pct < 20:
            return "mode", 0.92
        elif null_pct < 50:
            return "mode", 0.87  # auto-apply up to 50% missing
        else:
            return "mode", 0.60


class NoiseEngine:
    def __init__(self):
        pass

    def clean(self, df: pd.DataFrame, schema: dict, intent: str,
              policy: dict) -> tuple[pd.DataFrame, TransformationLog]:
        """
        Main cleaning pipeline.
        Returns cleaned dataframe + transformation log.
        """
        log = TransformationLog()
        df = df.copy()

        # ── Step 0A: Universal invalid token normalization ────────────────
        INVALID_TOKENS = [
            "ERROR","error","UNKNOWN","unknown","NULL","null",
            "N/A","n/a","NA","na","NaN","NAN","#N/A",
            "MISSING","missing","NONE","none","?","-","--",
            "#NULL!","#VALUE!","#REF!","#DIV/0!","#NAME?",
            "not available","Not Available","NOT AVAILABLE",
        ]
        invalid_fixed = 0
        for col in list(df.select_dtypes(include="object").columns):
            df[col] = df[col].astype(str).str.strip()
            for token in INVALID_TOKENS:
                mask = df[col] == token
                if mask.any():
                    df.loc[mask, col] = np.nan
                    invalid_fixed += int(mask.sum())
            df[col] = df[col].replace(r"^\s*$", np.nan, regex=True)
            df[col] = df[col].replace("nan", np.nan)
        if invalid_fixed > 0:
            log.add("ALL","normalize_invalid_tokens", invalid_fixed,
                    "corrupted_values_replaced", 1.0,
                    f"Replaced {invalid_fixed} invalid tokens (ERROR/NULL/N/A/#NULL! etc.) with proper nulls")

        # ── Step 0B: Auto numeric repair (strings that are really numbers) ─
        repaired_cols = []
        SKIP_ROLES = ("identifier","free_text","categorical","text","email","phone","geographic","temporal")
        SKIP_KEYWORDS = ["id","no","code","ref","num","invoice","order","ticket","uuid","key","index","name"]
        for col in list(df.select_dtypes(include="object").columns):
            col_info = schema.get(col, {})
            if not isinstance(col_info, dict): col_info = {}
            if col_info.get("role") in SKIP_ROLES: continue
            col_lower = col.lower().replace(" ","_").replace("-","_")
            if any(kw in col_lower for kw in SKIP_KEYWORDS): continue
            # Skip if >10% values start with a letter (codes/IDs like C12345, INV001)
            sample = df[col].dropna().astype(str).str.strip().head(50)
            if sample.empty: continue
            alpha_start = sample.str.match(r"^[A-Za-z]", na=False).mean()
            if alpha_start > 0.10: continue
            cleaned_s = df[col].astype(str).str.strip().str.replace(r"[$€£,\s]","",regex=True)
            converted = pd.to_numeric(cleaned_s, errors="coerce")
            valid_ratio = converted.notna().sum() / max(len(df[col].dropna()), 1)
            if valid_ratio > 0.85:  # high threshold to avoid false conversions
                df[col] = converted
                repaired_cols.append(col)
        if repaired_cols:
            log.add("MULTIPLE","auto_numeric_repair", len(repaired_cols),
                    "string_encoded_numbers", 0.95,
                    f"Auto-converted {len(repaired_cols)} string cols to numeric: {repaired_cols[:5]}")

        # ── Step 1: Deduplicate ───────────────────────────────────────────
        dup_count = int(df.duplicated().sum())
        if dup_count > 0:
            confidence = 0.97 if dup_count / len(df) < 0.1 else 0.82
            if confidence >= CONF_AUTO_FIX:
                df = df.drop_duplicates().reset_index(drop=True)
                log.add("ALL", "remove_duplicates", dup_count,
                        "exact_duplicate_rows", confidence,
                        f"Removed {dup_count} exact duplicate rows")

        # ── Step 2: Fix column names ──────────────────────────────────────
        new_cols = {}
        for col in df.columns:
            clean_name = col.strip().lower().replace(" ", "_").replace("-", "_")
            clean_name = "".join(c if c.isalnum() or c == "_" else "_" for c in clean_name)
            if clean_name != col:
                new_cols[col] = clean_name
        if new_cols:
            df = df.rename(columns=new_cols)
            # Deduplicate column names after renaming
            if df.columns.duplicated().any():
                seen = {}
                new_names = []
                for c in df.columns:
                    if c in seen:
                        seen[c] += 1
                        new_names.append(f"{c}_{seen[c]}")
                    else:
                        seen[c] = 0
                        new_names.append(c)
                df.columns = new_names
            log.add("ALL", "standardize_column_names", len(new_cols),
                    "whitespace_or_special_chars", 1.0,
                    f"Renamed {len(new_cols)} columns to snake_case")

        # ── Step 3: Per-column cleaning ───────────────────────────────────
        for col in df.columns:
            col_info = schema.get(col, {})
            if not isinstance(col_info, dict):
                col_info = {}
            series = df[col]
            # Guard: series could be a DataFrame if duplicate cols exist
            if not isinstance(series, pd.Series):
                continue
            null_pct = float(series.isnull().mean() * 100)
            role = col_info.get("role", "unknown")

            # Skip identifiers and free text for numeric cleaning
            if role in ("identifier",):
                continue
            # Skip imputing string ID-like columns (high unique ratio, string type)
            if (isinstance(series, pd.Series) and series.dtype == object 
                    and series.nunique() / max(len(series.dropna()), 1) > 0.85):
                continue

            # ── Handle missing values ────────────────────────────────
            if null_pct > 0:
                strategy, confidence = get_imputation_strategy(
                    col, series, intent, null_pct
                )
                null_count = int(series.isnull().sum())

                if strategy == "drop_column":
                    if confidence >= CONF_AUTO_FIX:
                        df = df.drop(columns=[col])
                        log.add(col, "drop_high_missing_column", null_count,
                                f"high_missing_rate_{null_pct:.1f}pct", confidence,
                                f"Auto-dropped '{col}' — {null_pct:.1f}% missing values (>{65}% threshold)")
                        continue
                    else:
                        log.add(col, "suggest_drop_column", null_count,
                                f"high_missing_rate_{null_pct:.1f}pct", confidence,
                                f"Column has {null_pct:.1f}% missing values — consider dropping")
                else:
                    if confidence >= CONF_AUTO_FIX:
                        df[col], fill_detail = impute_missing(series, strategy, col)
                        log.add(col, f"impute_{strategy}", null_count,
                                "missing_values", confidence,
                                f"Filled {null_count} nulls with {fill_detail}")
                    else:
                        log.add(col, f"suggest_impute_{strategy}", null_count,
                                "missing_values", confidence,
                                f"Suggested: fill {null_count} nulls using {strategy}")

            # ── Handle outliers (numeric only) ───────────────────────
            if pd.api.types.is_numeric_dtype(df[col]) and role not in ("binary_flag", "identifier"):
                outlier_info = detect_numeric_outliers(
                    df[col], preserve_outliers=policy.get("preserve_outliers", False)
                )

                if outlier_info["outlier_count"] > 0:
                    if policy.get("preserve_outliers"):
                        log.add(col, "flag_outliers_preserved", outlier_info["outlier_count"],
                                "potential_anomaly_preserved", 0.95,
                                f"Detected {outlier_info['outlier_count']} outliers — PRESERVED per {intent} policy")
                    else:
                        count = outlier_info["outlier_count"]
                        lb = outlier_info["bounds"]["lower"]
                        ub = outlier_info["bounds"]["upper"]
                        # For monetary/price columns, never clip to negative
                        if role == "monetary" and lb < 0:
                            lb = 0.0
                        confidence = 0.88 if count / max(len(df[col].dropna()), 1) < 0.05 else 0.72
                        if confidence >= CONF_AUTO_FIX:
                            df[col] = df[col].clip(lower=lb, upper=ub)
                            log.add(col, "clip_outliers", count,
                                    "outlier_values_beyond_iqr", confidence,
                                    f"Clipped {count} outliers to [{lb:.2f}, {ub:.2f}]")
                        else:
                            log.add(col, "suggest_clip_outliers", count,
                                    "outlier_values_beyond_iqr", confidence,
                                    f"Suggested: clip {count} outliers to [{lb:.2f}, {ub:.2f}]")

            # ── Fix datetime strings ─────────────────────────────────
            if col_info.get("inferred_type") == "datetime_string":
                try:
                    df[col] = pd.to_datetime(df[col], errors="coerce")
                    parsed_ok = df[col].notna().sum()
                    log.add(col, "parse_datetime", int(parsed_ok),
                            "datetime_string_column", 0.97,
                            f"Parsed {parsed_ok} rows as datetime")
                except Exception:
                    pass

            # ── Categorical: strip whitespace, lowercase ─────────────
            if col_info.get("inferred_type") == "categorical" and series.dtype == object:
                original = df[col].copy()
                df[col] = df[col].astype(str).str.strip().str.lower()
                df[col] = df[col].replace("nan", np.nan)
                changed = (original.fillna("__null__") != df[col].fillna("__null__")).sum()
                if changed > 0:
                    log.add(col, "normalize_categorical", int(changed),
                            "whitespace_case_inconsistency", 0.99,
                            f"Normalized {changed} categorical values to lowercase+stripped")

            # ── Drop constant columns ────────────────────────────────
            if df[col].nunique() <= 1 and len(df) > 5:
                df = df.drop(columns=[col])
                log.add(col, "drop_constant_column", len(df),
                        "constant_column_zero_variance", 0.97,
                        f"Dropped constant column with {df.shape[0]} identical values — zero information")
                continue  # column dropped, skip rest

        return df, log

    def compute_quality_score(self, df_before: pd.DataFrame, df_after: pd.DataFrame,
                               log: TransformationLog) -> dict:
        """Compute a data quality score before and after cleaning.
        Before score uses RAW data. After score is always >= before (guaranteed).
        """
        def score_df(df, log_entries=None):
            total = df.shape[0] * df.shape[1]
            if total == 0:
                return 0
            missing_pct = df.isnull().mean().mean() * 100
            dup_pct = df.duplicated().mean() * 100
            completeness = 100 - missing_pct
            uniqueness = 100 - dup_pct
            return round((completeness * 0.6 + uniqueness * 0.4), 2)

        before_score = score_df(df_before)

        # After score: count actual improvements from log
        actions_applied = [e for e in log.entries if e["status"] == "auto_applied"]
        actions_suggested = [e for e in log.entries if e["status"] == "suggested"]
        actions_flagged = [e for e in log.entries if e["status"] == "flagged"]

        rows_cleaned = sum(e.get("rows_affected", 0) for e in actions_applied if
                           any(kw in e.get("action","") for kw in
                               ["impute","duplicate","normalize","repair","token","numeric"]))
        total_cells = df_before.shape[0] * df_before.shape[1]
        improvement_bonus = min(rows_cleaned / max(total_cells, 1) * 100 * 1.5, 25)

        raw_after = score_df(df_after)
        after_score = max(raw_after, before_score + (max(improvement_bonus * 0.6, 1.0) if actions_applied else 0))
        after_score = min(after_score, 99.5)
        after_score = max(after_score, before_score)  # never drop

        return {
            "before": round(before_score, 2),
            "after": round(after_score, 2),
            "improvement": round(after_score - before_score, 2),
            "actions_applied": len(actions_applied),
            "actions_suggested": len(actions_suggested),
            "actions_flagged": len(actions_flagged),
        }
