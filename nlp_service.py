from flask import Flask, request, jsonify
from keybert import KeyBERT
import re
import string

app = Flask(__name__)
model = KeyBERT()

def clean_text(text):
    text = re.sub(r"#\w+", "", text)
    text = text.encode("ascii", "ignore").decode()
    text = re.sub(f"[{re.escape(string.punctuation)}]", "", text)
    return text.strip()

@app.route("/extract", methods=["POST"])
def extract():
    data = request.get_json()
    captions = data.get("texts", [])
    results = []

    for text in captions:
        clean = clean_text(text)
        keywords = model.extract_keywords(clean, keyphrase_ngram_range=(1, 3), stop_words='english', top_n=5)
        results.append({"original": text, "keywords": [k[0] for k in keywords]})

    return jsonify(results)

if __name__ == "__main__":
    app.run(port=5001)
