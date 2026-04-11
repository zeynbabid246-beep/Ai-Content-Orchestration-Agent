const BASE_URL = "http://localhost:5073";
async function request(path, options = {}) {
     const token = localStorage.getItem("accessToken");
     const headers = {
    "Content-Type": "application/json",          
    ...(token ? { Authorization: `Bearer ${token}` } : {}), 
    ...options.headers,                            
  };

  
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
    
      headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
      return fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
    
      localStorage.clear();
      window.location.href = "/login";
    }
  }

  return res;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false; 

  const res = await fetch(`${BASE_URL}/api/Auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (res.ok) {
    const data = await res.json();
    // Save the new tokens
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return true;
  }

  return false; 
}


export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: "DELETE" }),
};