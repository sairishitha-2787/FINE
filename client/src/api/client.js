const API_URL = 'http://127.0.0.1:8000'

const getToken = () => localStorage.getItem('token')

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }
  return response.json()
}

export const api = {
  signup: (name, email, password) =>
    fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    }).then(res => res.json()),

  login: (email, password) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json()),

  completeOnboarding: (data) =>
    fetch(`${API_URL}/user/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

  getTransactions: () =>
    fetch(`${API_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }).then(handleResponse),

  logTransaction: (data) =>
    fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),
}
