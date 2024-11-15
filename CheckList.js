// checklist-component.js
import { marked } from 'https://esm.sh/marked@15.0.0'
window.marked = marked
// checklist-component.js

class CheckList extends HTMLElement {
  constructor() {
    super();
    this.src = this.getAttribute('src');
    this.data = [];
    this.loaded = false;
    this.localStorageKey = `checklist-${this.src}`;
  }

  async connectedCallback() {
    if (!this.loaded) {
      await this.loadMarkdown();
      this.loadProgress();
      this.render();
      this.loaded = true;
    }
  }

  async loadMarkdown() {
    try {
      const response = await fetch(this.src);
      const markdown = await response.text();
      const html = this.convertMarkdownToHtml(markdown);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      this.data = this.parseList(doc.body);
    } catch (error) {
      console.error('Failed to load markdown', error);
    }
  }

  convertMarkdownToHtml(markdown) {
    // Convert markdown to HTML using a library or simple regex approach
    // For simplicity, assume a function like marked.parse() from a library like Marked
    return marked.parse(markdown);
  }

  wasparseList(node, depth = 0) {
    const items = [];
    for (let child of node.children) {
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        items.push(...this.parseList(child, depth + 1));
      } else if (child.tagName === 'LI') {
        items.push({
          text: child.textContent.trim(), // Use textContent to get the full content of the list item
          depth,
          done: false,
          children: this.parseList(child.querySelector('ul, ol') || document.createElement('div'), depth + 1),
        });
      }
    }
    return items;
  }
  
  parseList(node, depth = 0) {
    const items = [];
    for (let child of node.children) {
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        // Recursively parse the nested list and add its items
        items.push(...this.parseList(child, depth + 1));
      } else if (child.tagName === 'LI') {
        // Extract the text content from the <li> without including nested lists
        const listItem = {
          text: '',
          depth,
          done: false,
          children: []
        };
        
        // Iterate through child nodes of the <li> to separate text and nested lists
        for (let liChild of child.childNodes) {
          if (liChild.nodeType === Node.TEXT_NODE) {
            listItem.text += liChild.textContent.trim() + ' ';
          } else if (liChild.tagName === 'UL' || liChild.tagName === 'OL') {
            // If there is a nested list, parse it and add to the children
            listItem.children = this.parseList(liChild, depth + 1);
          } else if (liChild.tagName === 'CODE') {
            // Handle inline code properly
            listItem.text += '`' + liChild.textContent.trim() + '` ';
          }
        }
  
        listItem.text = listItem.text.trim();  // Trim the final text to clean up
  
        items.push(listItem);
      }
    }
    return items;
  }
  
  
  loadProgress() {
    const savedProgress = localStorage.getItem(this.localStorageKey);
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      this.applyProgress(this.data, parsedProgress);
    }
  }

  applyProgress(data, progress) {
    data.forEach((item, index) => {
      if (progress[index]) {
        item.done = progress[index].done;
        if (item.children && item.children.length > 0) {
          this.applyProgress(item.children, progress[index].children);
        }
      }
    });
  }

  saveProgress() {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.data));
  }

  render() {
    this.innerHTML = '';
    const checklistContainer = document.createElement('div');
    checklistContainer.classList.add('checklist');
    checklistContainer.appendChild(this.createList(this.data));
    this.appendChild(checklistContainer);
    this.checkCompletion();
  }

  createList(items) {
    const ul = document.createElement('ul');
    items.forEach((item) => {
      const li = document.createElement('li');
      li.classList.add('task-item');
      if (item.done) li.classList.add('done');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.done;
      checkbox.addEventListener('change', () => {
        item.done = checkbox.checked;
        if (item.children.length > 0) {
          this.updateChildrenState(item, item.done);
        }
        this.updateParentState();
        this.saveProgress();
        this.render();
      });

      const label = document.createElement('label');
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${item.text}`));

      li.appendChild(label);

      if (item.children.length > 0) {
        li.appendChild(this.createList(item.children));
      }

      ul.appendChild(li);
    });
    return ul;
  }

  updateChildrenState(item, state) {
    item.children.forEach((child) => {
      child.done = state;
      if (child.children.length > 0) {
        this.updateChildrenState(child, state);
      }
    });
  }

  updateParentState() {
    const updateStateRecursive = (item) => {
      if (item.children.length > 0) {
        item.done = item.children.every((child) => child.done);
        item.children.forEach(updateStateRecursive);
      }
    };
    this.data.forEach(updateStateRecursive);
  }

  checkCompletion() {
    if (this.data.every((item) => item.done)) {
      this.showCelebration();
    }
  }

  showCelebration() {
    // A simple celebratory animation, such as a confetti burst or alert
    const celebration = document.createElement('div');
    celebration.classList.add('celebration');
    celebration.innerText = 'Congratulations! You completed all tasks! 🎉';
    document.body.appendChild(celebration);

    setTimeout(() => {
      celebration.remove();
    }, 5000);
  }
}

customElements.define("check-list", CheckList)

// Usage Example in HTML
// <check-list src="tasks.md"></check-list>

export { CheckList }
// Usage Example in HTML
// <check-list src="tasks.md"></check-list>
