from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Define possible task types
task_types = ["Translation", "Review", "Marketing", "Design", "Testing"]

# Updated hardcoded worker data
workers = [
    {
        "name": "Alice",
        "task_types": {
            "Translation": 5,
            "Review": 4
        },
        "availability": {
            "Monday": 8,
            "Tuesday": 8,
            "Wednesday": 8,
            "Thursday": 8,
            "Friday": 8
        }
    },
    {
        "name": "Bob",
        "task_types": {
            "Marketing": 5,
            "Review": 5
        },
        "availability": {
            "Monday": 6,
            "Tuesday": 6,
            "Wednesday": 6,
            "Thursday": 6,
            "Friday": 6
        }
    },
    {
        "name": "Charlie",
        "task_types": {
            "Design": 5,
            "Translation": 4,
            "Review": 2
        },
        "availability": {
            "Monday": 7,
            "Tuesday": 0,
            "Wednesday": 0,
            "Thursday": 0,
            "Friday": 7
        }
    },
    {
        "name": "Diana",
        "task_types": {
            "Design": 3,
            "Marketing": 3,
            "Translation": 3,
            "Review": 3
        },
        "availability": {
            "Monday": 5,
            "Tuesday": 5,
            "Wednesday": 5,
            "Thursday": 5,
            "Friday": 5
        }
    },
    {
        "name": "Eve",
        "task_types": {
            "Design": 4,
            "Marketing": 4
        },
        "availability": {
            "Monday": 4,
            "Tuesday": 8,
            "Wednesday": 8,
            "Thursday": 8,
            "Friday": 4
        }
    }
]

@app.route('/api/workers', methods=['GET'])
def get_workers():
    return jsonify(workers)

@app.route('/api/task_types', methods=['GET'])
def get_task_types():
    return jsonify(task_types)

@app.route('/api/assign_task', methods=['POST'])
def assign_task():
    task_data = request.get_json()
    task_type = task_data['task_type']
    # ... (rest of the assign_task function remains the same)

if __name__ == '__main__':
    app.run(debug=True)