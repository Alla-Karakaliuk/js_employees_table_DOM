'use strict';

function parseSalary(value) {
  if (!value) {
    return 0;
  }

  return Number(value.replace(/[^0-9.]/g, ''));
}

const table = document.querySelector('table');
const tableBody = document.querySelector('tbody');

table.addEventListener('click', (e) => {
  const th = e.target.closest('th');

  if (!th) {
    return;
  }

  const currentOrder = th.dataset.order === 'asc' ? 'desc' : 'asc';

  th.dataset.order = currentOrder;

  sortTableByColumn(th.cellIndex, currentOrder);
});

function sortTableByColumn(colIndex, order) {
  const rows = document.querySelectorAll('tbody tr');
  const rowsArr = Array.from(rows);

  rowsArr.sort((rowA, rowB) => {
    const a = rowA.children[colIndex].textContent.trim();
    const b = rowB.children[colIndex].textContent.trim();

    if (colIndex === 4) {
      const salaryA = parseSalary(a);
      const salaryB = parseSalary(b);

      return order === 'asc' ? salaryA - salaryB : salaryB - salaryA;
    }

    return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
  });

  rowsArr.forEach((row) => tableBody.appendChild(row));
}

tableBody.addEventListener('click', (e) => {
  const row = e.target.closest('tr');

  if (!row) {
    return;
  }

  tableBody.querySelectorAll('tr').forEach((r) => {
    r.classList.remove('active');
  });

  row.classList.add('active');
});

const body = document.querySelector('body');
const form = document.createElement('form');

form.classList = 'new-employee-form';

body.appendChild(form);

function fieldCreate({
  tag,
  qa,
  type = 'text',
  labelText = '',
  required = false,
  options = [],
}) {
  const label = document.createElement('label');

  if (labelText) {
    label.textContent = labelText;
  }

  let field;

  switch (tag) {
    case 'input':
      field = document.createElement('input');
      field.type = type;
      break;

    case 'select':
      field = document.createElement('select');

      options.forEach((city) => {
        const option = document.createElement('option');

        option.value = city.toLowerCase().replace(/\s+/g, '-');
        option.text = city;
        field.appendChild(option);
      });
      break;

    case 'button':
      field = document.createElement('button');
      field.type = type;
      field.textContent = labelText;
      break;

    default:
      throw new Error(`Unknown field type: ${tag}`);
  }

  if (qa) {
    field.dataset.qa = qa;
    field.name = qa;
  }

  if (tag === 'button') {
    form.appendChild(field);
  } else {
    label.appendChild(field);
    form.appendChild(label);
  }

  return field;
}

const formConfig = [
  {
    tag: 'input',
    qa: 'name',
    labelText: 'Name:',
    required: true,
  },

  {
    tag: 'input',
    qa: 'position',
    labelText: 'Position:',
    required: true,
  },

  {
    tag: 'select',
    qa: 'office',
    labelText: 'Office:',
    options: [
      'Tokyo',
      'Singapore',
      'London',
      'New York',
      'Edinburgh',
      'San Francisco',
    ],
    required: true,
  },

  {
    tag: 'input',
    qa: 'age',
    type: 'number',
    labelText: 'Age:',
    required: true,
  },

  {
    tag: 'input',
    qa: 'salary',
    type: 'number',
    labelText: 'Salary:',
    required: true,
  },

  {
    tag: 'button',
    type: 'submit',
    labelText: 'Save to table',
  },
];

const columnRules = {
  0: {
    name: 'name',
    minLength: 4,
  },

  1: {
    name: 'position',
    minLength: 2,
  },

  2: {
    name: 'office',
  },

  3: {
    name: 'age',
    type: 'number',
    min: 18,
    max: 90,
  },

  4: {
    name: 'salary',
    type: 'number',
    min: 0,
    parse: parseSalary,
    format: (v) => '$' + Number(v).toLocaleString('en-US'),
  },
};

function validateValue(value, rule) {
  if (value === '') {
    return false;
  }

  if (!rule) {
    return true;
  }

  if (rule.minLength && value.length < rule.minLength) {
    return false;
  }

  if (rule.type === 'number') {
    const parsed = rule.parse ? rule.parse(value) : value;
    const num = Number(parsed);

    if (Number.isNaN(num)) {
      return false;
    }

    if (rule.min !== undefined && num < rule.min) {
      return false;
    }

    if (rule.max !== undefined && num > rule.max) {
      return false;
    }
  }

  return true;
}

formConfig.forEach(fieldCreate);

const pushNotification = (type, title, message) => {
  const notification = document.createElement('div');

  notification.dataset.qa = 'notification';
  notification.classList.add('notification', type);

  const h = document.createElement('h2');

  h.textContent = title;
  notification.appendChild(h);

  const p = document.createElement('p');

  p.textContent = message;
  notification.appendChild(p);

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
};

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();

    return;
  }

  const newTr = document.createElement('tr');

  for (const colIndex in columnRules) {
    const rule = columnRules[colIndex];
    const field = form.elements[rule.name];
    let value = field.value.trim();

    if (field.tagName === 'SELECT') {
      value = field.options[field.selectedIndex].text;
    }

    if (!validateValue(value, rule)) {
      pushNotification('error', 'Error', `Invalid ${rule.name}`);
      field.focus();

      return;
    }

    if (rule.format) {
      value = rule.format(value);
    }

    const newTd = document.createElement('td');

    newTd.textContent = value;
    newTr.appendChild(newTd);
  }

  tableBody.appendChild(newTr);
  pushNotification('success', 'Success!', 'Data added successfully');
  form.reset();
  form.elements.name.focus();
});

tableBody.addEventListener('dblclick', (e) => {
  const td = e.target.closest('td');

  if (!td) {
    return;
  }

  if (td.querySelector('input')) {
    return;
  }

  const initialData = td.textContent;

  td.textContent = '';

  const input = document.createElement('input');

  input.value = initialData;
  td.appendChild(input);
  input.focus();

  const colIndex = td.cellIndex;
  const rule = columnRules[colIndex];

  input.addEventListener('blur', () => {
    const value = input.value.trim();

    if (!validateValue(value, rule)) {
      pushNotification('error', 'Error', `Invalid ${rule.name}`);
      td.textContent = initialData;

      return;
    }

    td.textContent = rule.format ? rule.format(value) : value;
  });

  input.addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter') {
      input.blur();
    }

    if (evt.key === 'Escape') {
      td.textContent = initialData;
      input.remove();
    }
  });
});
