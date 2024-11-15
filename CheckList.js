class CheckList extends HTMLElement {
  constructor() {
    super();
    // Initialize the component state
    this.tasks = [];
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(document.getElementById('check-list-template').content.cloneNode(true));
  }

  connectedCallback() {
    const inputArea = this.shadowRoot.querySelector('#inputArea');
    inputArea.addEventListener('input', () => {
      this.tasks = this.parseTasks(inputArea.value);
      this.renderTasks();
    });

    this.shadowRoot.querySelector('#sortInitials').addEventListener('click', () => this.sortByInitials());
    this.shadowRoot.querySelector('#sortDone').addEventListener('click', () => this.sortByDone());
    this.shadowRoot.querySelector('#sortTask').addEventListener('click', () => this.sortByTask());
  }

  parseTasks(inputText) {
    const lines = inputText.trim().split('\n');
    return lines.map(line => {
      const [task, initial] = line.trim().split(' - ');
      return {
        task: task.trim(),
        initial: initial ? initial.trim() : '',
        done: false
      };
    });
  }

  sortByInitials() {
    this.tasks.sort((a, b) => a.initial.localeCompare(b.initial));
    this.renderTasks();
  }

  sortByDone() {
    this.tasks.sort((a, b) => a.done === b.done ? 0 : a.done ? -1 : 1);
    this.renderTasks();
  }

  sortByTask() {
    this.tasks.sort((a, b) => a.task.localeCompare(b.task));
    this.renderTasks();
  }

  renderTasks() {
    const taskList = this.shadowRoot.querySelector('#taskList');
    taskList.innerHTML = ''; // Clear existing tasks

    this.tasks.forEach(task => {
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
      });

      li.textContent = task.task;
      li.prepend(checkbox);
      taskList.appendChild(li);
    });
  }
} 
export {CheckList}
customElements.define('check-list', CheckList)
