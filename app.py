from flask import Flask, render_template, request, jsonify
from deadlock_toolkit import DeadlockToolkit

app = Flask(__name__)

toolkit = None  # global instance


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/init", methods=["POST"])
def api_init():
    global toolkit
    data = request.get_json()
    n = data.get("n")
    m = data.get("m")
    toolkit = DeadlockToolkit(n, m)
    return jsonify({"status": "ok"})


@app.route("/api/update_state", methods=["POST"])
def api_update_state():
    global toolkit
    data = request.get_json()
    max_mat = data["max"]
    alloc_mat = data["alloc"]
    avail_vec = data["avail"]

    toolkit.max_need = max_mat
    toolkit.alloc = alloc_mat
    toolkit.avail = avail_vec
    toolkit.update_need()

    graph = toolkit.build_wait_for_graph()
    return jsonify({"need": toolkit.need, "graph": graph})


@app.route("/api/check_safe", methods=["GET"])
def api_check_safe():
    global toolkit
    safe, seq = toolkit.is_safe()
    seq_labels = [f"P{p}" for p in seq]
    return jsonify({"safe": safe, "sequence": seq_labels})


@app.route("/api/detect_deadlock", methods=["GET"])
def api_detect_deadlock():
    global toolkit
    deadlocked = toolkit.detect_deadlock()
    labels = [f"P{p}" for p in deadlocked]
    return jsonify({"deadlocked": labels})


@app.route("/api/recover", methods=["POST"])
def api_recover():
    global toolkit
    victim, msg = toolkit.recover()
    graph = toolkit.build_wait_for_graph()
    return jsonify({
        "victim": None if victim is None else f"P{victim}",
        "message": msg,
        "need": toolkit.need,
        "graph": graph
    })


@app.route("/api/request", methods=["POST"])
def api_request():
    global toolkit
    data = request.get_json()
    pid = data["pid"]
    req = data["req"]

    granted, msg = toolkit.request_resources(pid, req)
    graph = toolkit.build_wait_for_graph()
    return jsonify({
        "granted": granted,
        "message": msg,
        "need": toolkit.need,
        "graph": graph
    })


if __name__ == "__main__":
    app.run(debug=True)
