document.getElementById("fileInput").addEventListener("change", function () {
  const fileName = this.files[0] ? this.files[0].name : "No file chosen";
  document.getElementById("fileName").textContent = fileName;
});

// Add this event listener for the main task input
document.getElementById("taskInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addTask();
  }
});

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

if (tasks.length === 0) {
  tasks = [];
  saveTasks();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const taskDiv = document.createElement("div");
    taskDiv.className = `task-container task-column ${
      task.completed ? "bg-success" : ""
    }`;

    taskDiv.innerHTML = `
      <div class="d-flex align-items-center">
        <span class="handle"><i class="fa-solid fa-up-down-left-right"></i></span>
        <input type="checkbox" class="me-2" onchange="toggleTask(${index})" ${
      task.completed ? "checked" : ""
    }>
        <span class="task-text ${
          task.completed ? "completed-text" : ""
        }" id="task-text-${index}">${task.text}</span>
        <div class="ms-auto">
          <button class="btn btn-success btn-sm ms-2" onclick="addSubTask(${index})"><i class="fa fa-plus"></i></button>
          <button class="btn btn-warning btn-sm ms-2" onclick="editTask(${index})"><i class="fa fa-edit"></i></button>
          <button class="btn btn-danger btn-sm ms-2" onclick="removeTask(${index})"><i class="fa fa-trash"></i></button>
        </div>
      </div>
      <div class="ms-4 mt-2" id="subtasks-${index}"></div>
    `;
    taskList.appendChild(taskDiv);
    renderSubTasks(index);
  });

  new Sortable(taskList, {
    animation: 150,
    handle: ".handle",
    onEnd: function (evt) {
      if (evt.oldIndex === evt.newIndex) return;

      const movedTask = tasks.splice(evt.oldIndex, 1)[0];
      tasks.splice(evt.newIndex, 0, movedTask);

      saveTasks();
      renderTasks();
    },
  });
}

function addTask() {
  const taskInput = document.getElementById("taskInput");
  if (!taskInput.value.trim()) {
    alert("Task cannot be empty!");
    return;
  }
  tasks.push({ text: taskInput.value, completed: false, subtasks: [] });
  taskInput.value = "";
  saveTasks();
  renderTasks();
}

function loadTasksFromFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file first!");
    return;
  }

  if (file.type !== "application/json") {
    alert("Please select a valid JSON file.");
    return;
  }

  const loadButton = document.querySelector(
    'button[onclick="loadTasksFromFile()"]'
  );
  loadButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';
  loadButton.disabled = true;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const loadedTasks = JSON.parse(event.target.result);
      tasks = loadedTasks;
      saveTasks();
      renderTasks();
    } catch (error) {
      alert("Error reading the file. Please make sure it's a valid JSON file.");
    } finally {
      loadButton.innerHTML = "Load Tasks from File";
      loadButton.disabled = false;
    }
  };
  reader.readAsText(file);
}

function downloadTasks() {
  let fileName = "";

  while (!fileName.trim()) {
    fileName = prompt("Enter file name (without extension):");

    if (fileName === null) {
      alert("Download canceled! No file was saved.");
      return;
    }

    if (!fileName.trim()) {
      alert("File name cannot be empty. Please enter a valid name.");
    }
  }

  const finalFileName = fileName.trim() + ".json";

  const tasksJson = JSON.stringify(tasks, null, 2);
  const blob = new Blob([tasksJson], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  tasks[index].subtasks.forEach(
    (sub) => (sub.completed = tasks[index].completed)
  );
  saveTasks();
  renderTasks();
}

function removeTask(index) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

function addSubTask(index) {
  const subTaskInput = document.createElement("input");
  subTaskInput.type = "text";
  subTaskInput.className = "form-control mb-2";
  subTaskInput.placeholder = "Enter sub-task";

  const addSubTaskToList = () => {
    if (!subTaskInput.value.trim()) {
      alert("Subtask cannot be empty!");
      subTaskInput.remove();
      return;
    }

    tasks[index].subtasks.push({ text: subTaskInput.value, completed: false });
    tasks[index].completed = false;

    saveTasks();
    renderTasks();
  };


  subTaskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubTaskToList();
    }
  });

  document.getElementById(`subtasks-${index}`).appendChild(subTaskInput);
  subTaskInput.focus();
}

function renderSubTasks(index) {
  const subtaskContainer = document.getElementById(`subtasks-${index}`);
  subtaskContainer.innerHTML = "";
  subtaskContainer.dataset.taskIndex = index;

  tasks[index].subtasks.forEach((subtask, subIndex) => {
    const subDiv = document.createElement("div");
    subDiv.className = `subtask d-flex align-items-center mt-1 ${
      subtask.completed ? "completed" : ""
    }`;
    subDiv.innerHTML = `
      <span class="handle"><i class="fa-solid fa-up-down"></i></span>
      <input type="checkbox" class="me-2" onchange="toggleSubTask(${index}, ${subIndex})" ${
      subtask.completed ? "checked" : ""
    }>
      <span id="subtask-text-${index}-${subIndex}" class="${
      subtask.completed ? "completed-text" : ""
    }">${subtask.text}</span>
      <div class="ms-auto">
        <button class="btn btn-warning btn-sm ms-2" onclick="editSubTask(${index}, ${subIndex})"><i class="fa fa-edit"></i></button>
        <button class="btn btn-danger btn-sm ms-2" onclick="removeSubTask(${index}, ${subIndex})"><i class="fa fa-trash"></i></button>
      </div>
    `;
    subtaskContainer.appendChild(subDiv);
  });

  new Sortable(subtaskContainer, {
    group: "subtasks",
    animation: 150,
    handle: ".handle",
    onEnd: function (evt) {
      const oldTaskIndex = evt.from.dataset.taskIndex;
      const newTaskIndex = evt.to.dataset.taskIndex;

      const movedSubTask = tasks[oldTaskIndex].subtasks.splice(
        evt.oldIndex,
        1
      )[0];
      tasks[newTaskIndex].subtasks.splice(evt.newIndex, 0, movedSubTask);

      saveTasks();
      renderTasks();
    },
  });
}

function toggleSubTask(index, subIndex) {
  tasks[index].subtasks[subIndex].completed =
    !tasks[index].subtasks[subIndex].completed;

  const allSubTasksCompleted = tasks[index].subtasks.every(
    (subtask) => subtask.completed
  );

  tasks[index].completed = allSubTasksCompleted;

  saveTasks();
  renderTasks();
}

function removeSubTask(index, subIndex) {
  if (confirm("Are you sure you want to delete this subtask?")) {
    tasks[index].subtasks.splice(subIndex, 1);
    saveTasks();
    renderTasks();
  }
}

function editTask(index) {
  const taskText = document.getElementById(`task-text-${index}`);

  const existingInput =
    taskText.parentElement.querySelector('input[type="text"]');
  if (existingInput) {
    updateTask(index, existingInput.value);
    return;
  }

  taskText.style.display = "none";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control form-control-sm";
  input.value = tasks[index].text;

  const taskTextParent = taskText.parentElement;
  taskTextParent.style.display = "flex";
  taskTextParent.style.alignItems = "center";
  taskTextParent.style.justifyContent = "space-between";

  input.style.flex = "1";

  const confirmEdit = () => {
    updateTask(index, input.value);
    taskText.style.display = "inline";
    input.remove();
  };

  input.onkeypress = function (e) {
    if (e.key === "Enter") {
      confirmEdit();
    }
  };

  input.onblur = confirmEdit;

  taskTextParent.insertBefore(input, taskText);
  input.focus();
}

function updateTask(index, newText) {
  if (!newText.trim()) {
    alert("Task cannot be empty!");
    return;
  }

  tasks[index].text = newText;
  saveTasks();
  renderTasks();
}

function editSubTask(index, subIndex) {
  const subtaskText = document.getElementById(
    `subtask-text-${index}-${subIndex}`
  );

  const existingInput =
    subtaskText.parentElement.querySelector('input[type="text"]');
  if (existingInput) {
    updateSubTask(index, subIndex, existingInput.value);
    return;
  }

  subtaskText.style.display = "none";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "form-control form-control-sm";
  input.value = tasks[index].subtasks[subIndex].text;

  const subtaskTextParent = subtaskText.parentElement;
  subtaskTextParent.style.display = "flex";
  subtaskTextParent.style.alignItems = "center";
  subtaskTextParent.style.justifyContent = "space-between";

  input.style.flex = "1";

  const confirmEdit = () => {
    updateSubTask(index, subIndex, input.value);
    subtaskText.style.display = "inline";
    input.remove();
  };

  input.onkeypress = function (e) {
    if (e.key === "Enter") {
      confirmEdit();
    }
  };

  input.onblur = confirmEdit;

  subtaskTextParent.insertBefore(input, subtaskText);
  input.focus();
}

function updateSubTask(index, subIndex, newText) {
  if (!newText.trim()) {
    alert("Subtask cannot be empty!");
    return;
  }

  tasks[index].subtasks[subIndex].text = newText;
  saveTasks();
  renderTasks();
}

function clearAllTasks() {
  if (confirm("Are you sure you want to delete all tasks?")) {
    tasks = [];
    saveTasks();
    renderTasks();
  }
}

renderTasks();
