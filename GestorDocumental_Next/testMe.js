import fetch from "node-fetch";

async function testMe() {
  try {
    const res = await fetch("http://localhost:8000/api/me", {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "include", // solo tiene efecto si estás manejando cookies en navegador
    });

    if (!res.ok) throw new Error("Usuario no autenticado");

    const data = await res.json();
    console.log("Usuario autenticado:", data.user);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testMe();
