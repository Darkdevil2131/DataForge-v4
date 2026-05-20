"""
chatbot_engine.py — Smart DataForge AI Chatbot
Uses local ML + HuggingFace live search + curated knowledge.
Zero cost. No external LLM API.
"""
import re, json, os
from engines.kaggle_search import search_datasets
from engines.intent_classifier import IntentClassifier

_ic = None
def _get_ic():
    global _ic
    if _ic is None:
        _ic = IntentClassifier()
    return _ic

# ── Rich knowledge base (not rule-based — query-specific) ────────────────────
ML_MODELS = {
    "fraud_detection":  [("XGBoost + SMOTE","Best AUC on imbalanced tabular data"),("IsolationForest","Unsupervised — no labels needed, great for unknown fraud patterns"),("LightGBM","Fast on large datasets, handles class imbalance with scale_pos_weight")],
    "classification":   [("XGBoost","State of the art for tabular classification — wins most Kaggle competitions"),("RandomForest","Robust baseline, built-in feature importance, handles noise well"),("Logistic Regression","Always start here — interpretable, fast, good baseline")],
    "regression":       [("GradientBoosting","Best tabular regression performance, handles non-linearity"),("Ridge/Lasso","Regularized linear — fast, interpretable, prevents overfitting"),("XGBoost Regressor","High performance, handles outliers better than linear models")],
    "forecasting":      [("Prophet","Handles seasonality + trend automatically, works out of the box"),("XGBoost + lag features","Often beats LSTM on tabular time-series with proper feature engineering"),("ARIMA/SARIMA","Classical, interpretable, good baseline for stationary series")],
    "nlp":              [("DistilBERT","Fast transformer, 97% of BERT performance at 60% size"),("TF-IDF + Logistic Regression","Surprisingly strong baseline for text classification"),("FastText","Lightweight, production-ready, great for classification")],
    "analytics":        [("No ML needed","Use aggregation + groupby for BI dashboards"),("K-Means Clustering","Customer segmentation — unsupervised"),("PCA","Dimensionality reduction for exploration")],
    "recommendation":   [("SVD (Surprise)","Collaborative filtering standard — easy to implement"),("ALS","Scalable matrix factorization for large datasets"),("LightFM","Hybrid: combines collaborative + content filtering")],
    "general_ml":       [("XGBoost","Best all-around for tabular data"),("RandomForest","Robust, interpretable baseline"),("Logistic/Linear Regression","Always start simple before going complex")],
}

CLEANING_KB = {
    "missing":   "**Missing values strategy:**\n- Numeric columns → **median** (skew-resistant) or mean (normal dist)\n- Categorical → **mode** (most frequent value)\n- Time-series → **forward fill** (preserves temporal pattern)\n- >65% missing in a column → **drop the column** (too little signal)\n\n💡 DataForge AI handles all of this automatically — just upload your file.",
    "outlier":   "**Outlier handling strategy:**\n- For **fraud/anomaly detection** → KEEP outliers (they are signals!)\n- For **regression/classification** → clip to IQR bounds (1.5× rule)\n- For **time-series** → preserve (could be real events like COVID, Black Friday)\n- Use ensemble: IQR + Z-score + IsolationForest for best accuracy.",
    "duplicate": "**Removing duplicates:**\n- Exact duplicates → always safe to remove\n- Near-duplicates (same entity, slight variation) → need domain knowledge\n- In time-series → check if they're the same timestamp before removing\n\n✅ DataForge auto-detects and removes exact duplicates with 97% confidence.",
    "encode":    "**Encoding categorical variables:**\n- <15 unique values → **One-hot encoding** (creates binary columns)\n- >15 unique values → **Frequency encoding** (replace with occurrence rate)\n- Ordinal data (Low/Med/High) → **Label encoding** (preserves order)\n- High-cardinality IDs → **Drop** (no signal for ML)",
    "scale":     "**Feature scaling:**\n- **StandardScaler** → for normally distributed features (most ML models)\n- **MinMaxScaler** → for neural networks (values between 0-1)\n- **RobustScaler** → when outliers exist (uses median, not mean)\n- Tree models (XGBoost, RandomForest) → scaling NOT needed",
    "imbalance": "**Class imbalance solutions:**\n- **SMOTE** → oversample minority class (best for tabular data)\n- **class_weight='balanced'** → easy fix, tell model to weight classes\n- **Undersample** majority class → fast but loses data\n- Metric: use **F1/AUC** not accuracy (accuracy is misleading on imbalanced data)",
    "leakage":   "**Data leakage prevention:**\n- Never use future data in training features\n- Always split data FIRST, then fit preprocessing on train set only\n- Drop ID columns — they have no predictive power\n- Be careful with timestamp features — no future timestamps in train",
}

CONCEPTS = {
    "overfitting":    "**Overfitting** = model memorizes training data including noise, fails on new data.\n**Fix:** Cross-validation, regularization (Ridge/L2), dropout (neural nets), early stopping, more data.",
    "underfitting":   "**Underfitting** = model too simple to learn patterns.\n**Fix:** Use more complex model, add more features, reduce regularization, train longer.",
    "bias variance":  "**Bias-Variance Tradeoff:**\n- High bias = underfitting (model too simple)\n- High variance = overfitting (model too complex)\n- Goal: find the sweet spot with cross-validation.",
    "cross validation":"**Cross-Validation:** Split data into K folds, train on K-1, test on 1, rotate.\nGives more reliable accuracy estimate than a single train/test split.",
    "feature importance":"**Feature Importance:** How much each feature contributes to predictions.\nXGBoost/RandomForest give it for free. Use it to remove low-signal features.",
    "precision recall":"**Precision vs Recall:**\n- Precision = of predicted positives, how many are actually positive\n- Recall = of actual positives, how many did we catch\n- For fraud: maximize Recall (don't miss fraud) at cost of Precision",
    "auc roc":        "**AUC-ROC:** Area Under the ROC Curve. Measures how well model separates classes.\n- AUC = 1.0 → perfect model\n- AUC = 0.5 → random guessing\n- AUC > 0.9 → excellent for most tasks",
}

def _detect_intent(msg: str) -> str:
    msg = msg.lower()
    if any(w in msg for w in ["dataset","data","kaggle","hugging","find","recommend","suggest","where get","need.*data","looking for"]):
        return "find_dataset"
    if any(w in msg for w in ["model","algorithm","xgboost","random forest","neural","deep learning","which.*use","best.*for"]):
        return "ml_advice"
    if any(w in msg for w in ["missing","null","nan","duplicate","outlier","clean","preprocess","encode","scale","impute","normalize"]):
        return "cleaning"
    if any(w in msg for w in ["what is","explain","how does","difference","why","when to","what does","define"]):
        return "explain"
    if any(w in msg for w in ["hi","hello","hey","sup","start","help","what can"]):
        return "greeting"
    return "general"


def generate_response(message: str, history: list = None) -> dict:
    msg = message.strip()
    if not msg:
        return {"text":"Please type a message.", "datasets":[], "suggestions":[], "type":"error"}

    msg_lower = msg.lower()
    chat_intent = _detect_intent(msg_lower)
    ic = _get_ic()
    ml_intent = ic.classify(msg)["intent"]
    task_label = ml_intent.replace("_"," ").title()

    # ── GREETING ─────────────────────────────────────────────────────────────
    if chat_intent == "greeting":
        return {
            "text": "👋 Hi! I'm **DataForge Assistant**.\n\nI can help you:\n• 🔍 **Find datasets** — search Kaggle & HuggingFace\n• 🤖 **Model advice** — best algorithms for your task\n• 🧹 **Cleaning tips** — handle missing values, outliers, encoding\n• 📚 **Explain concepts** — overfitting, AUC, cross-validation\n\nWhat are you working on?",
            "datasets": [],
            "suggestions": ["Find fraud detection dataset","Best models for classification","How to handle missing values?"],
            "type": "greeting"
        }

    # ── DATASET SEARCH — live + curated, query-specific ──────────────────────
    if chat_intent == "find_dataset":
        datasets = search_datasets(msg, ml_intent, limit=5)
        if datasets:
            lines = []
            for i, ds in enumerate(datasets[:4], 1):
                name = ds.get("name","Dataset")
                url  = ds.get("url","")
                desc = str(ds.get("description",""))[:90]
                src  = ds.get("source","Kaggle")
                diff = ds.get("difficulty","intermediate")
                lines.append(f"**{i}. [{name}]({url})**\n   {desc}...\n   `{src}` · {diff}")
            text = f"🔍 Found **{len(datasets)} datasets** for **{task_label}**:\n\n" + "\n\n".join(lines)
            text += "\n\n💡 Upload any of these on the **Process** page — DataForge will clean it automatically."
            return {"text": text, "datasets": datasets[:4], "suggestions": [f"Best model for {task_label}","How to clean this dataset?","What features to engineer?"], "type":"dataset_search"}
        return {"text": f"No datasets found for that query. Try being more specific, e.g. 'fraud detection credit card dataset' or 'customer churn telecom dataset'.", "datasets":[], "suggestions":["Credit card fraud dataset","Customer churn dataset","House prices regression dataset"], "type":"no_results"}

    # ── ML MODEL ADVICE — specific to query ──────────────────────────────────
    if chat_intent == "ml_advice":
        models = ML_MODELS.get(ml_intent, ML_MODELS["general_ml"])
        lines = [f"**{m[0]}** — {m[1]}" for m in models]
        text = f"🤖 **Best models for {task_label}:**\n\n" + "\n".join(f"• {l}" for l in lines)
        
        # Add task-specific tips
        tips = {
            "fraud_detection": "\n\n⚠️ **Critical:** Use F1/AUC not accuracy — class imbalance makes accuracy misleading.",
            "forecasting":     "\n\n⚠️ **Critical:** Never shuffle time-series data. Split by time, not randomly.",
            "regression":      "\n\n💡 **Tip:** Log-transform skewed targets (like house prices) before training.",
            "classification":  "\n\n💡 **Tip:** Always start with Logistic Regression baseline before trying complex models.",
        }
        text += tips.get(ml_intent, "\n\n💡 **Tip:** Start simple. XGBoost with default params beats most tuned complex models.")
        
        # Dynamic suggestions based on what they asked about
        sug = [f"Find {task_label} dataset", "How to handle class imbalance?", "What is cross-validation?"]
        return {"text": text, "datasets":[], "suggestions": sug, "type":"ml_advice"}

    # ── CLEANING HELP — specific technique ───────────────────────────────────
    if chat_intent == "cleaning":
        # Match specific cleaning topic
        matched = None
        for key, content in CLEANING_KB.items():
            if key in msg_lower or any(syn in msg_lower for syn in {
                "missing":["null","nan","empty","na ","n/a"],
                "outlier":["anomal","extreme","unusual","spike"],
                "duplicate":["dupl","repeat","same row"],
                "encode":["categor","one-hot","label encod","ordinal"],
                "scale":["normaliz","standardiz","minmax","robust"],
                "imbalance":["imbalanced","class weight","smote","minority","majority"],
                "leakage":["leakage","future data","data leak","target leak"],
            }.get(key,[])):
                matched = content
                break
        
        if not matched:
            # Give general cleaning overview
            matched = "**DataForge AI cleaning pipeline:**\n1. **Invalid tokens** — replaces ERROR/NULL/N/A/? with proper nulls\n2. **Duplicates** — removes exact duplicate rows automatically\n3. **Missing values** — median for numeric, mode for categorical\n4. **Outliers** — IQR clipping for ML tasks, preserved for fraud\n5. **Encoding** — one-hot for categories, frequency for high-cardinality\n6. **Scaling** — StandardScaler for numeric features\n\nAll context-aware based on your goal (fraud vs analytics vs forecasting)."
        
        return {"text": matched, "datasets":[], "suggestions":["Upload my dataset to clean it","Find clean practice dataset",f"Best model for {task_label}"], "type":"cleaning"}

    # ── EXPLAIN CONCEPT ───────────────────────────────────────────────────────
    if chat_intent == "explain":
        for concept, explanation in CONCEPTS.items():
            if any(word in msg_lower for word in concept.split()):
                sug = ["What is cross-validation?","What is AUC-ROC?","How to handle overfitting?"]
                return {"text": f"📚 {explanation}", "datasets":[], "suggestions": sug, "type":"explain"}
        # General explain fallback
        return {"text": f"Could you be more specific? I can explain:\n• **Overfitting/Underfitting**\n• **Cross-validation**\n• **Bias-Variance tradeoff**\n• **AUC-ROC, Precision, Recall**\n• **Feature importance**\n• **Data leakage**\n\nJust ask about any of these!", "datasets":[], "suggestions":["What is overfitting?","What is AUC-ROC?","Explain bias variance tradeoff"], "type":"explain"}

    # ── GENERAL — use ML intent to be smart ──────────────────────────────────
    datasets = search_datasets(msg, ml_intent, limit=3)
    models = ML_MODELS.get(ml_intent, ML_MODELS["general_ml"])
    text = f"I detected your goal as **{task_label}**.\n\n"
    if datasets:
        text += f"**Relevant datasets:**\n" + "\n".join(f"• [{ds['name']}]({ds['url']}) — {ds.get('source','Kaggle')}" for ds in datasets[:3])
        text += f"\n\n**Top model:** {models[0][0]} — {models[0][1]}"
        text += "\n\nOr upload your own dataset on the **Process** page."
    return {"text": text, "datasets": datasets[:3], "suggestions": [f"Find more {task_label} datasets", f"All models for {task_label}", "How to clean this data?"], "type":"general"}
