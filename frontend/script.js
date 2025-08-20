// Function to populate task types dropdown
async function populateTaskTypes() {
    const taskTypeSelect = document.getElementById('taskType');
    taskTypeSelect.innerHTML = ''; // Clear existing options

    // Check if task types exist in localStorage
    let taskTypes = localStorage.getItem('taskTypes');

    if (taskTypes) {
        // If data exists in localStorage, parse it from there
        taskTypes = JSON.parse(taskTypes);
    } else {
        // If data doesn't exist in localStorage, fetch it from the backend (a hardcoded example in app.py)
        const response = await fetch('/api/task_types');
        taskTypes = await response.json();
        // After fetching task types, save it in localStorage
        localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
    }

    // Populate the task type dropdown with options from the `taskTypes` array
    // Each task type is added as an option element to the select element
    taskTypes.forEach(taskType => {
        const option = document.createElement('option');
        option.value = taskType;
        option.textContent = taskType;
        taskTypeSelect.appendChild(option);
    });
}

// Function to find the best worker
async function findBestWorker() {
    const taskType = document.getElementById('taskType').value;
    const taskHours = parseInt(document.getElementById('taskHours').value);
    const deadline = document.getElementById('taskDay').value;
    const today = new Date();
    const todayDay = getTodayDay();
    // Get the worker data from localStorage
    let workers = JSON.parse(localStorage.getItem('workers'));

    // Sort workers by proficiency in descending order for the given task type
    const qualifiedWorkers = workers.filter(worker => worker.task_types[taskType])
        .sort((a, b) => b.task_types[taskType] - a.task_types[taskType]);

    let bestWorker = null;
    let totalAvailability = 0;

    // Iterate through qualified workers to find one with enough availability
    for (const worker of qualifiedWorkers) {
        totalAvailability = 0;
        //Calculate total availability from today to deadline
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        let startDayIndex = daysOfWeek.indexOf(todayDay);
        let endDayIndex = daysOfWeek.indexOf(deadline);

        if (startDayIndex === -1 || endDayIndex === -1) {
            console.error("Invalid day of the week");
            return;
        }

        let currentDayIndex = startDayIndex;
        let daysCounted = 0;

        // Loop through the days until we reach the deadline or we have counted all the days in the week
        while (daysCounted < daysOfWeek.length) {
            totalAvailability += worker.availability[daysOfWeek[currentDayIndex]];
            if (daysOfWeek[currentDayIndex] === deadline) {
                break;
            }
            currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
            daysCounted++;
        }

        if (totalAvailability >= taskHours) {
            bestWorker = worker;
            break; // Found a suitable worker
        }
    }

    const recommendationDiv = document.getElementById('recommendation');

    // Show the user the best worker for the task info entered
    if (bestWorker) {
        recommendationDiv.innerHTML = `The best worker for this task is <b>${bestWorker.name}</b>, with proficiency ${bestWorker.task_types[taskType]} in ${taskType}, and ${totalAvailability} hours available until ${deadline}.`;
    } else {
        recommendationDiv.textContent = `No worker found with enough availability for ${taskType} between today and ${deadline}.`;
    }
}

// Function to edit task types
function editTaskTypes(worker, cell) {
    cell.innerHTML = ''; // Clear the cell content
    for (const taskType in worker.task_types) {
        const taskTypeDiv = document.createElement('div');
        taskTypeDiv.innerHTML = `
            <label>${taskType}:</label>
            <input type="number" class="editProficiency" data-tasktype="${taskType}" value="${worker.task_types[taskType]}" min="1" max="5">
            <button class="deleteTaskType" data-tasktype="${taskType}">Delete</button>
        `;
        cell.appendChild(taskTypeDiv);
    }

    // Add "Add Task Type" button
    const addTaskTypeButton = document.createElement('button');
    addTaskTypeButton.textContent = 'Add Task Type';
    addTaskTypeButton.addEventListener('click', () => {
        const newTaskType = prompt('Enter new task type:');
        if (newTaskType) {
            worker.task_types[newTaskType] = 1; // Default proficiency
            editTaskTypes(worker, cell); // Re-render the edit view

            // Update taskTypes in local storage
            let taskTypes = JSON.parse(localStorage.getItem('taskTypes'));
            if (!taskTypes.includes(newTaskType)) {
                taskTypes.push(newTaskType);
                localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
                populateTaskTypes(); // Refresh the dropdown
            }
        }
    });

    cell.appendChild(addTaskTypeButton);

    // Add event listeners to the delete buttons
    const deleteTaskButtons = cell.querySelectorAll('.deleteTaskType');
    deleteTaskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const taskTypeToDelete = button.dataset.tasktype;
            delete worker.task_types[taskTypeToDelete]; // Delete task type from worker
            editTaskTypes(worker, cell); // Re-render the edit view

            // Update taskTypes in local storage
            let taskTypes = JSON.parse(localStorage.getItem('taskTypes'));
            const index = taskTypes.indexOf(taskTypeToDelete);

            // *Check if any other worker still has this task type*
            let anyOtherWorkerHasTaskType = false;
            let workers = JSON.parse(localStorage.getItem('workers'));
            for (const otherWorker of workers) {
                if (otherWorker !== worker && otherWorker.task_types[taskTypeToDelete]) {
                    anyOtherWorkerHasTaskType = true;
                    break;
                }
            }

            if (index > -1 && !anyOtherWorkerHasTaskType) {
                taskTypes.splice(index, 1);
                localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
                populateTaskTypes(); // Refresh the dropdown
            }
        });
    });
}

// Function to save worker data
function saveWorker(index) {
    // Get the updated values from the input fields
    const newName = document.getElementById('editName').value;

    // Get the task types from the input fields
    const taskTypeInputs = document.querySelectorAll('#workersTable tr:nth-child(' + (index + 2) + ') .editProficiency'); // Select only the relevant row
    const newTaskTypes = {};
    taskTypeInputs.forEach(input => {
        const taskType = input.dataset.tasktype;
        newTaskTypes[taskType] = parseInt(input.value);

        //Update taskTypes in local storage (check if task type exists, if not, add it)
        let taskTypes = JSON.parse(localStorage.getItem('taskTypes'));
        if (!taskTypes.includes(taskType)) {
            taskTypes.push(taskType);
            localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
        }
    });

    const newMonday = document.getElementById('editMonday').value;
    const newTuesday = document.getElementById('editTuesday').value;
    const newWednesday = document.getElementById('editWednesday').value;
    const newThursday = document.getElementById('editThursday').value;
    const newFriday = document.getElementById('editFriday').value;

    // Get the worker data from localStorage
    let workers = JSON.parse(localStorage.getItem('workers'));

    // Update the worker object with the new values
    workers[index].name = newName;
    workers[index].task_types = newTaskTypes;
    workers[index].availability = {
        Monday: parseInt(newMonday),
        Tuesday: parseInt(newTuesday),
        Wednesday: parseInt(newWednesday),
        Thursday: parseInt(newThursday),
        Friday: parseInt(newFriday)
    };

    // Save the updated worker data to localStorage
    localStorage.setItem('workers', JSON.stringify(workers));

    // Display the updated worker data in the table
    displayWorkers(workers);

    populateTaskTypes(); // Refresh the dropdown
}

// Function to populate task types dropdown
async function populateTaskTypes() {
    const taskTypeSelect = document.getElementById('taskType');
    taskTypeSelect.innerHTML = ''; // Clear existing options

    // Check if task types exist in localStorage
    let taskTypes = localStorage.getItem('taskTypes');

    if (taskTypes) {
        // If data exists, parse it from localStorage
        taskTypes = JSON.parse(taskTypes);
    } else {
        // If data doesn't exist, fetch it from the backend
        const response = await fetch('/api/task_types');
        taskTypes = await response.json();
        // After fetching task types, save it to local storage
        localStorage.setItem('taskTypes', JSON.stringify(taskTypes));
    }

    taskTypes.forEach(taskType => {
        const option = document.createElement('option');
        option.value = taskType;
        option.textContent = taskType;
        taskTypeSelect.appendChild(option);
    });
}

// Set today's day of the week and populate task types on page load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('todayDay').textContent = getTodayDay();
    populateTaskTypes();
});

// Function to get today's day of the week
function getTodayDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const today = new Date();
    return days[today.getDay()];
}

// Function to fetch and display worker data
async function loadAndDisplayWorkers() {
    // Check if worker data exists in localStorage
    let workers = localStorage.getItem('workers');

    if (workers) {
        // If data exists, parse it from localStorage
        workers = JSON.parse(workers);
        displayWorkers(workers);
    } else {
        // If data doesn't exist, fetch it from the backend
        const response = await fetch('/api/workers');
        const data = await response.json();
        workers = data;
        // After fetching workers, save it to local storage
        localStorage.setItem('workers', JSON.stringify(workers));
        displayWorkers(workers);
    }
}

// Function to display worker data in a table
function displayWorkers(workers) {
    const table = document.createElement('table');
    table.id = 'workersTable';

    // Create table header
    const headerRow = table.insertRow();
    const headers = ['Name', 'Tasks: Proficiency', 'Mon (h)', 'Tue (h)', 'Wed (h)', 'Thu (h)', 'Fri (h)', ''];
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });

    // Create table rows for each worker
    workers.forEach((worker, index) => {
        const row = table.insertRow();

        const nameCell = row.insertCell();
        nameCell.textContent = worker.name;

        // Task Types Cell
        const taskTypesCell = row.insertCell();
        displayTaskTypes(worker, taskTypesCell); // Function to display Task Types

        const mondayCell = row.insertCell();
        mondayCell.textContent = worker.availability.Monday;

        const tuesdayCell = row.insertCell();
        tuesdayCell.textContent = worker.availability.Tuesday;

        const wednesdayCell = row.insertCell();
        wednesdayCell.textContent = worker.availability.Wednesday;

        const thursdayCell = row.insertCell();
        thursdayCell.textContent = worker.availability.Thursday;

        const fridayCell = row.insertCell();
        fridayCell.textContent = worker.availability.Friday;

        const actionsCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => editWorker(index));
        actionsCell.appendChild(editButton);
    });

    // Append the table to the result div
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Clear previous content
    resultDiv.appendChild(table);
}

// Function to display task types
function displayTaskTypes(worker, cell) {
    cell.innerHTML = ''; // Clear the cell content
    for (const taskType in worker.task_types) {
        const taskTypeDiv = document.createElement('div');
        taskTypeDiv.textContent = `${taskType}: ${worker.task_types[taskType]}`;
        cell.appendChild(taskTypeDiv);
    }
}

// Function to edit worker data
function editWorker(index) {
    // Get the table and the row to be edited
    const table = document.getElementById('workersTable');
    const row = table.rows[index + 1]; // +1 to account for the header row

    // Get the worker data from localStorage
    let workers = JSON.parse(localStorage.getItem('workers'));
    const worker = workers[index];

    // Replace the cells with input fields
    row.cells[0].innerHTML = `<input type="text" id="editName" value="${worker.name}">`;

    // Task types - Now handled by a separate function
    editTaskTypes(worker, row.cells[1]);

    row.cells[2].innerHTML = `<input type="number" id="editMonday" value="${worker.availability.Monday}">`;
    row.cells[3].innerHTML = `<input type="number" id="editTuesday" value="${worker.availability.Tuesday}">`;
    row.cells[4].innerHTML = `<input type="number" id="editWednesday" value="${worker.availability.Wednesday}">`;
    row.cells[5].innerHTML = `<input type="number" id="editThursday" value="${worker.availability.Thursday}">`;
    row.cells[6].innerHTML = `<input type="number" id="editFriday" value="${worker.availability.Friday}">`;

    // Change the "Edit" button to "Save"
    row.cells[7].innerHTML = '<button onclick="saveWorker(' + index + ')">Save</button>';
}

// Initial load
loadAndDisplayWorkers();