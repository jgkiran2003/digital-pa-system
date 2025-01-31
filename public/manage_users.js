// manage_users.js

document.getElementById('showCreateFormBtn').addEventListener('click', () => {
    const form = document.getElementById('createUserForm');
    form.style.display = (form.style.display === 'none') ? 'block' : 'none';
  });
  
  document.getElementById('createUserBtn').addEventListener('click', handleCreateUser);
  
  async function handleCreateUser() {
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const role = document.getElementById('roleInput').value;
    const dept = document.getElementById('deptInput').value;
  
    if (!username || !email || !password) {
      alert('Please fill out username, email, and password');
      return;
    }
  
    // POST /api/users
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role, dept }),
    });
    if (!res.ok) {
      alert('Failed to create user');
      return;
    }
    alert('User created!');
    document.getElementById('createUserForm').style.display = 'none';
    await loadUsers();
  }
  
  async function loadUsers() {
    // GET /api/users
    const res = await fetch('/api/users');
    if (!res.ok) {
      console.error('Failed to fetch users');
      return;
    }
    const users = await res.json();
    renderUsersTable(users);
  }
  
  function renderUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
  
    users.forEach(u => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${u.UID}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.dept}</td>
        <td>
          <button style="background-color:#92a1d1;" onclick="editUser(${u.UID})">Edit</button>
          <button style="background-color:#d36c6c;" onclick="deleteUser(${u.UID})">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Example stub for edit/delete
  async function deleteUser(uid) {
    if (!confirm(`Delete user #${uid}?`)) return;
    // DELETE /api/users/:uid
    const res = await fetch(`/api/users/${uid}`, { method: 'DELETE' });
    if (!res.ok) alert('Failed to delete user');
    await loadUsers();
  }
  
  function editUser(uid) {
    alert(`Edit user #${uid}: Not implemented yet.`);
  }
  
  // Load user list on page load
  loadUsers();
  